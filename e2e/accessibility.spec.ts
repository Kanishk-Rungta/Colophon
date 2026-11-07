import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile,mkdir} from 'node:fs/promises';
test('automated accessibility checks across the six product screens',async({page})=>{
  test.setTimeout(90000);
  const reports=[];
  for(const path of ['/','/demo','/demo/studio','/demo/evidence','/demo/review','/demo/records']){
    await page.goto(path);if(path.startsWith('/demo'))await expect(page.getByRole('button',{name:'Export saved workspace'})).toBeEnabled();
    if(path==='/demo/studio'){await page.getByRole('button',{name:'Run Brand Review',exact:true}).click();await expect(page.getByText('REVIEW COMPLETE',{exact:true})).toBeVisible();}
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    reports.push({path,violations:result.violations});
    if(path==='/demo/studio')await page.getByRole('button',{name:'Submit for review',exact:true}).click();
    if(path==='/demo/review'){
      while(await page.getByRole('button',{name:'Override with reason'}).count()){
        await page.getByRole('button',{name:'Override with reason'}).first().click();await page.getByLabel('Reason for accepting this exception').fill('Accepted only for an isolated accessibility test scenario.');await page.getByRole('button',{name:'Record override'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      await page.getByRole('button',{name:'Approve this version',exact:true}).click();await page.getByRole('button',{name:'Confirm human approval'}).click();await expect(page.getByRole('heading',{name:'A decision, on the record.'})).toBeVisible();
    }
  }
  await mkdir('artifacts',{recursive:true});await writeFile('artifacts/accessibility-report.json',JSON.stringify(reports,null,2));
  expect(reports.flatMap(r=>r.violations.map(v=>({path:r.path,rule:v.id,targets:v.nodes.map(n=>n.target)})))).toEqual([]);
});
