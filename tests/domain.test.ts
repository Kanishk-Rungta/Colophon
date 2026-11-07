import { beforeEach,describe,it,expect } from 'vitest';
import { createWorkspace, SAMPLES } from '../lib/seed';
import { execute,currentVersion,currentScan } from '../lib/domain';
import type { Workspace,Actor } from '../lib/schema';
let state:Workspace, actor:Actor;
const run=async(command:Parameters<typeof execute>[1])=>{state=await execute(state,command,actor);return state;};
const id=()=>state.contents[0].id;
beforeEach(()=>{state=createWorkspace('owner-a','workspace-a');actor=state.owner;});
describe('review lifecycle and permission boundaries',()=>{
  it('runs the whole judge journey with immutable revisions and record snapshots',async()=>{
    const original=structuredClone(state); await run({type:'scan',contentId:id()});
    expect(currentScan(state,state.contents[0])?.findings).toHaveLength(3);
    const term=currentScan(state,state.contents[0])!.findings[0]; await run({type:'suggestion',contentId:id(),findingId:term.id});
    expect(state.versions[0]).toEqual(original.versions[0]);expect(state.contents[0].scanId).toBeUndefined();
    await run({type:'save',contentId:id(),title:'Launch',body:SAMPLES[2].body,scope:'global marketing'}); await run({type:'scan',contentId:id()});
    await run({type:'submit',contentId:id()});await run({type:'decide',contentId:id(),outcome:'approved',note:'All configured evidence was reviewed.'});
    expect(state.records).toHaveLength(1);const record=structuredClone(state.records[0]);expect(record.contentHash).toMatch(/^[a-f0-9]{64}$/);expect(record.version.body).toBe(SAMPLES[2].body);
    expect(record.audit.some(e=>e.action==='Revision approved')).toBe(true);expect(record.history[0].scans[0].findings).toHaveLength(3);
    await run({type:'save',contentId:id(),title:'Changed',body:'A different draft',scope:'global marketing'});expect(state.records[0]).toEqual(record);expect(state.contents[0].state).toBe('draft');
  });
  it('requires a scan before submission',async()=>expect(run({type:'submit',contentId:id()})).rejects.toThrow(/fresh/));
  it('rejects approval outside review',async()=>expect(run({type:'decide',contentId:id(),outcome:'approved',note:''})).rejects.toThrow(/awaiting/));
  it('prevents creator-only approval',async()=>{await run({type:'scan',contentId:id()});await run({type:'submit',contentId:id()});actor={...actor,roles:['creator']};await expect(run({type:'decide',contentId:id(),outcome:'approved',note:''})).rejects.toThrow(/permission/);});
  it('prevents cross-workspace reads and mutations',async()=>{actor={...actor,workspaceId:'other'};await expect(run({type:'scan',contentId:id()})).rejects.toThrow(/permission/);});
  it('does not let blockers be approved without reasoned overrides',async()=>{await run({type:'scan',contentId:id()});await run({type:'submit',contentId:id()});await expect(run({type:'decide',contentId:id(),outcome:'approved',note:''})).rejects.toThrow(/blocking/);
    for(const f of currentScan(state,state.contents[0])!.findings.filter(f=>f.severity==='blocking')){await expect(run({type:'override',contentId:id(),findingId:f.id,reason:'ok'})).rejects.toThrow();await run({type:'override',contentId:id(),findingId:f.id,reason:'Accepted as a fictional exception in this isolated demonstration.'});}
    await run({type:'decide',contentId:id(),outcome:'approved',note:'Exceptions consciously accepted.'});expect(state.records[0].scan.findings.filter(f=>f.status==='overridden')).toHaveLength(2);
  });
  it('preserves disputes without bypassing blocking findings',async()=>{await run({type:'scan',contentId:id()});const f=currentScan(state,state.contents[0])!.findings.find(f=>f.severity==='blocking')!;await run({type:'dispute',contentId:id(),findingId:f.id,reason:'Please double-check this count with the brand administrator.'});await run({type:'submit',contentId:id()});await expect(run({type:'decide',contentId:id(),outcome:'approved',note:''})).rejects.toThrow(/blocking/);});
  it('requests changes with a recorded reason and permits a new revision',async()=>{await run({type:'scan',contentId:id()});await run({type:'submit',contentId:id()});await expect(run({type:'save',contentId:id(),title:'Edit',body:'Text',scope:'global marketing'})).rejects.toThrow(/Request changes/);await expect(run({type:'decide',contentId:id(),outcome:'changes_requested',note:''})).rejects.toThrow(/Explain/);await run({type:'decide',contentId:id(),outcome:'changes_requested',note:'Correct the unsupported numerical claim.'});await run({type:'save',contentId:id(),title:'Corrected',body:SAMPLES[2].body,scope:'global marketing'});expect(currentVersion(state,state.contents[0]).number).toBe(2);expect(state.decisions[0].outcome).toBe('changes_requested');});
  it('creates and edits evidence with preserved old revisions',async()=>{const old=structuredClone(state.evidence[1]);await run({type:'evidence',record:{...old,title:'Revised language policy'}});expect(state.evidence[1].revision).toBe(2);expect(state.evidenceHistory[1]).toEqual(old);await run({type:'evidence',record:{...old,id:'TERM-NEW'}});expect(state.evidence.at(-1)?.id).toBe('TERM-NEW');});
  it('prevents creators from changing approved knowledge',async()=>{actor={...actor,roles:['creator']};await expect(run({type:'evidence',record:state.evidence[0]})).rejects.toThrow(/permission/);});
  it('rejects stale evidence edits',async()=>{const old=state.evidence[0];await run({type:'evidence',record:old});await expect(run({type:'evidence',record:old})).rejects.toThrow(/elsewhere/);});
  it('invalidates scans on evidence change',async()=>{await run({type:'scan',contentId:id()});await run({type:'archive',evidenceId:'TERM-006'});await expect(run({type:'submit',contentId:id()})).rejects.toThrow(/fresh/);});
  it('rechecks evidence validity at approval',async()=>{await run({type:'save',contentId:id(),title:'Clean',body:SAMPLES[2].body,scope:'global marketing'});await run({type:'scan',contentId:id()});await run({type:'submit',contentId:id()});await run({type:'evidence',record:{...state.evidence[0],expiresAt:'2026-02-01T00:00:00.000Z'}});await expect(run({type:'decide',contentId:id(),outcome:'approved',note:''})).rejects.toThrow(/fresh/);});
  it('rejects other workspace evidence and nonexistent content',async()=>{await expect(run({type:'evidence',record:{...state.evidence[0],workspaceId:'other'}})).rejects.toThrow(/different/);await expect(run({type:'scan',contentId:'nonexistent'})).rejects.toThrow(/not found/);});
});
