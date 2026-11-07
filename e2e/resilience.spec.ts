import {test,expect} from '@playwright/test';
test('a storage write failure preserves the saved revision and surfaces an error',async({page})=>{
  await page.goto('/demo/studio');await expect(page.getByLabel('Draft title')).toBeVisible();const original=await page.evaluate(()=>localStorage.getItem('colophon.workspace.v1'));
  await page.evaluate(()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='colophon.workspace.v1')throw new DOMException('Full','QuotaExceededError');return write.call(this,key,value);};});
  await page.getByRole('button',{name:'Run Brand Review',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Browser storage is full or unavailable'})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('colophon.workspace.v1'))).toBe(original);await expect(page.getByText('REVIEW COMPLETE',{exact:true})).toHaveCount(0);
});
test('malformed saved data is preserved and produces a recovery message',async({page})=>{
  await page.goto('/');await page.evaluate(()=>localStorage.setItem('colophon.workspace.v1','{"broken":true}'));await page.goto('/demo');await expect(page.getByRole('alert').filter({hasText:'Stored workspace data could not be read'})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('colophon.workspace.v1'))).toBe('{"broken":true}');
});
test('mobile navigation and modal dialogs support Escape and restore focus',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/demo/studio');await expect(page.getByLabel('Draft title')).toBeVisible();await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.getByRole('dialog',{name:'Workspace navigation menu'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open navigation'})).toBeFocused();await page.getByRole('button',{name:/Try a sample draft/}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('pasted markup is treated as text and edited spans become stale',async({page})=>{
  await page.goto('/demo/studio');await expect(page.getByLabel('Draft title')).toBeVisible();await page.getByLabel('Content to review').fill('<img src=x onerror="window.evil=true"> AI autopilot');await page.getByRole('button',{name:'Run Brand Review',exact:true}).click();await expect(page.getByRole('heading',{name:'Use the approved language'})).toBeVisible();expect(await page.evaluate(()=>Object.hasOwn(window,'evil'))).toBe(false);await expect(page.locator('img')).toHaveCount(0);await page.getByRole('button',{name:'Write',exact:true}).click();await page.getByLabel('Content to review').fill('Changed AI autopilot');await expect(page.getByText(/Analysis outdated/)).toBeVisible();await expect(page.getByRole('button',{name:'Apply suggestion',exact:true})).toBeDisabled();
});
