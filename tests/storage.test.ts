import {expect,it} from 'vitest';
import {createWorkspace} from '../lib/seed';
import {parseStorage} from '../lib/storage';
it('loads valid saved workspaces without changing data',()=>{const s=createWorkspace('owner','workspace');expect(parseStorage(JSON.stringify(s))).toEqual(s);});
it('rejects corrupted nested records before rendering',()=>{const s=createWorkspace('owner','workspace');const raw={...s,records:[{id:'broken'}]};expect(()=>parseStorage(JSON.stringify(raw))).toThrow();});
it('rejects invalid version relationships',()=>{const s=createWorkspace('owner','workspace');s.contents[0].currentVersionId='missing';expect(()=>parseStorage(JSON.stringify(s))).toThrow(/relationships/);});
