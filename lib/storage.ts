import {z} from 'zod';
import {evidenceSchema, type Workspace} from './schema';
const timestamp=z.iso.datetime(), id=z.string().min(1);
const actor=z.object({id,name:z.string(),workspaceId:id,roles:z.array(z.enum(['creator','reviewer','admin']))});
const version=z.object({id,contentId:id,number:z.number().int().positive(),body:z.string().max(20000),createdAt:timestamp,createdBy:id});
const finding=z.object({id,versionId:id,category:z.enum(['terminology','factual','claim','tone']),severity:z.enum(['blocking','warning','advisory']),verdict:z.enum(['supported','contradicted','insufficient_evidence','advisory']),start:z.number().int().nonnegative(),end:z.number().int().positive(),originalText:z.string(),title:z.string(),explanation:z.string(),evidenceIds:z.array(id),suggestedRevision:z.string().optional(),origin:z.enum(['rule','ai']),status:z.enum(['open','disputed','overridden']),reason:z.string().optional(),actionBy:id.optional()});
const scan=z.object({id,versionId:id,createdAt:timestamp,evidenceKey:z.string(),evidence:z.array(evidenceSchema),findings:z.array(finding),aiStatus:z.string()});
const decision=z.object({id,versionId:id,actorId:id,actorName:z.string(),outcome:z.enum(['approved','changes_requested']),note:z.string(),createdAt:timestamp});
const audit=z.object({id,actorId:id,actorName:z.string(),action:z.string(),subjectId:id,detail:z.string(),createdAt:timestamp});
export const workspaceStorageSchema=z.object({schemaVersion:z.literal(1),id,name:z.string(),revision:z.number().int().nonnegative(),owner:actor,evidence:z.array(evidenceSchema),evidenceHistory:z.array(evidenceSchema),contents:z.array(z.object({id,workspaceId:id,title:z.string(),scope:z.string(),currentVersionId:id,scanId:id.optional(),state:z.enum(['draft','scanned','in_review','returned','approved']),updatedAt:timestamp})),versions:z.array(version),scans:z.array(scan),decisions:z.array(decision),records:z.array(z.object({id,workspaceId:id,contentId:id,title:z.string(),scope:z.string(),version,scan,decision,contentHash:z.string().regex(/^[a-f0-9]{64}$/),createdAt:timestamp,audit:z.array(audit),history:z.array(z.object({version,scans:z.array(scan)}))})),audit:z.array(audit)});
export function parseStorage(raw:string):Workspace {
  const s=workspaceStorageSchema.parse(JSON.parse(raw));
  if(s.owner.workspaceId!==s.id || s.evidence.some(e=>e.workspaceId!==s.id) || s.contents.some(c=>c.workspaceId!==s.id || !s.versions.some(v=>v.id===c.currentVersionId&&v.contentId===c.id) || (c.scanId&&!s.scans.some(scan=>scan.id===c.scanId&&scan.versionId===c.currentVersionId)))) throw new Error('Invalid workspace relationships.');
  for(const scan of s.scans){
    const v=s.versions.find(v=>v.id===scan.versionId);if(!v)throw new Error('Missing scanned version.');
    if(scan.findings.some(f=>f.versionId!==v.id||f.end<=f.start||v.body.slice(f.start,f.end)!==f.originalText||f.evidenceIds.some(id=>!scan.evidence.some(e=>e.id===id))))throw new Error('Invalid finding relationships.');
  }
  return s;
}
