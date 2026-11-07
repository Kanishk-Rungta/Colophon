import {test,expect,type Browser} from '@playwright/test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync} from 'node:fs';
import {dirname,join} from 'node:path';

test.describe('live hosted security and persistence',()=>{
  test.skip(process.env.COLOPHON_TEST_HOSTED!=='1','Explicit hosted test opt-in required. Creates isolated fictional demo users.');
  const baseURL=process.env.PLAYWRIGHT_BASE_URL!;

  async function session(browser:Browser){
    const context=await browser.newContext({baseURL});
    const page=await context.newPage();
    let publicKey='',supabaseOrigin='';
    page.on('request',request=>{
      const url=new URL(request.url());
      if(url.hostname.endsWith('.supabase.co')){
        publicKey=request.headers().apikey??publicKey;
        supabaseOrigin=url.origin;
      }
    });
    const signup=page.waitForResponse(r=>r.url().includes('/auth/v1/signup')&&r.status()===200);
    await page.goto('/demo/studio');
    const auth=await (await signup).json();
    await expect(page.getByLabel('Draft title')).toBeVisible();
    const response=await context.request.get('/api/workspace');
    expect(response.status()).toBe(200);
    const {state}=await response.json();
    expect(await page.evaluate(()=>localStorage.getItem('colophon.workspace.v1'))).toBeNull();
    // Credentials remain in this test's memory, never written or printed.
    const headers={apikey:publicKey,Authorization:`Bearer ${auth.access_token}`};
    return {context,page,state,headers,supabaseOrigin};
  }

  test('independent sessions cannot read or mutate another workspace through API or RLS',async({browser,request})=>{
    const a=await session(browser),b=await session(browser);
    try{
      expect(a.state.id).not.toBe(b.state.id);
      expect(a.state.owner.id).not.toBe(b.state.owner.id);
      const own=await a.context.request.get(`${a.supabaseOrigin}/rest/v1/workspaces?select=id&id=eq.${a.state.id}`,{headers:a.headers});
      expect(own.status()).toBe(200);expect(await own.json()).toEqual([{id:a.state.id}]);
      const foreign=await b.context.request.get(`${b.supabaseOrigin}/rest/v1/workspaces?select=id&id=eq.${a.state.id}`,{headers:b.headers});
      expect(foreign.status()).toBe(200);expect(await foreign.json()).toEqual([]);
      const directWrite=await b.context.request.patch(`${b.supabaseOrigin}/rest/v1/workspace_members?user_id=eq.${a.state.owner.id}`,{headers:b.headers,data:{roles:['creator','reviewer','admin']}});
      expect(directWrite.status()).toBe(403);
      const rpc=await b.context.request.post(`${b.supabaseOrigin}/rest/v1/rpc/initialize_demo`,{headers:b.headers,data:{p_user_id:b.state.owner.id,p_workspace_id:b.state.id,p_state:b.state}});
      expect(rpc.status()).toBe(403);
      const foreignCommand=await b.context.request.post('/api/workspace',{headers:{Origin:baseURL},data:{revision:b.state.revision,command:{type:'scan',contentId:a.state.contents[0].id}}});
      expect(foreignCommand.status()).toBe(404);
      const unauthenticated=await request.get('/api/workspace');expect(unauthenticated.status()).toBe(401);
      const crossOrigin=await b.context.request.post('/api/workspace',{headers:{Origin:'https://untrusted.invalid'},data:{initialize:true}});expect(crossOrigin.status()).toBe(403);
      const initializedAgain=await a.context.request.post('/api/workspace',{headers:{Origin:baseURL},data:{initialize:true}});
      expect(initializedAgain.status()).toBe(200);const again=(await initializedAgain.json()).state;
      expect(again.id).toBe(a.state.id);expect(again.evidence).toHaveLength(9);expect(again.contents).toHaveLength(1);
      await a.page.reload();await expect(a.page.getByLabel('Draft title')).toBeVisible();
      const persisted=(await (await a.context.request.get('/api/workspace')).json()).state;
      expect(persisted.id).toBe(a.state.id);
    }finally{await a.context.close();await b.context.close();}
  });

  test('simultaneous saves reject the stale writer without losing the winning version',async({browser})=>{
    const a=await session(browser);
    try{
      const save=(title:string)=>a.context.request.post('/api/workspace',{headers:{Origin:baseURL},data:{revision:a.state.revision,command:{type:'save',contentId:a.state.contents[0].id,title,body:'Northline provides assisted automation for business teams.',scope:'global marketing'}}});
      const responses=await Promise.all([save('Concurrent draft A'),save('Concurrent draft B')]);
      expect(responses.map(r=>r.status()).sort()).toEqual([200,409]);
      const saved=(await (await a.context.request.get('/api/workspace')).json()).state;
      expect(saved.revision).toBe(a.state.revision+1);expect(saved.versions).toHaveLength(2);
    }finally{await a.context.close();}
  });

  test('server enforces reviewer permissions from current database membership',async({browser})=>{
    test.skip(process.env.COLOPHON_TEST_ADMIN!=='1','Requires an authenticated Supabase CLI and explicit admin-test opt-in.');
    test.setTimeout(90000);
    const project=process.env.COLOPHON_SUPABASE_PROJECT_REF;
    if(!project||!/^[a-z]{20}$/.test(project))throw new Error('Explicit valid target project ref required.');
    const run=promisify(execFile);
    let npxPath:string;
    if(process.platform==='win32'){
      const {stdout}=await run('where.exe',['npx.cmd']);
      npxPath=join(dirname(stdout.trim().split(/\r?\n/)[0]),'node_modules','npm','bin','npx-cli.js');
      if(!existsSync(npxPath))throw new Error('Cannot resolve the installed npm npx entry point.');
    }
    const query=async(sql:string)=>{
      const args=['--yes','supabase','db','query',`--remote=${project}`,'--yes',sql];
      if(process.platform==='win32')await run(process.execPath,[npxPath,...args],{timeout:45000});
      else await run('npx',args,{timeout:45000});
    };
    const a=await session(browser);
    const userId=a.state.owner.id,workspaceId=a.state.id;
    if(!/^[0-9a-f-]{36}$/.test(userId)||!/^[0-9a-f-]{36}$/.test(workspaceId))throw new Error('Unexpected test identity format.');
    try{
      await a.page.getByRole('button',{name:'Try a sample draft',exact:false}).click();
      await a.page.getByRole('button',{name:/The Northline introduction/}).click();
      await a.page.getByRole('button',{name:/Run Brand Review/}).click();
      await expect(a.page.getByText('REVIEW COMPLETE',{exact:true})).toBeVisible();
      await a.page.getByRole('button',{name:'Submit for review',exact:true}).click();
      await expect(a.page.getByRole('link',{name:'Open Review Desk',exact:true})).toBeVisible();
      await query(`update public.workspace_members set roles=array['creator'] where user_id='${userId}'::uuid and workspace_id='${workspaceId}'::uuid`);
      const state=(await (await a.context.request.get('/api/workspace')).json()).state;
      const denied=await a.context.request.post('/api/workspace',{headers:{Origin:baseURL},data:{revision:state.revision,command:{type:'decide',contentId:state.contents[0].id,outcome:'approved',note:'Permission enforcement test.'}}});
      expect(denied.status()).toBe(403);
      const unchanged=(await (await a.context.request.get('/api/workspace')).json()).state;
      expect(unchanged.records).toHaveLength(0);expect(unchanged.contents[0].state).toBe('in_review');
    }finally{
      try{await query(`update public.workspace_members set roles=array['creator','reviewer','admin'] where user_id='${userId}'::uuid and workspace_id='${workspaceId}'::uuid`);}finally{await a.context.close();}
    }
  });
});
