import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];const errors=[];
try {
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]) {
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<600,hasTouch:viewport.width<600,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:4173');await page.locator('.tile').first().waitFor();
  assert.equal(await page.locator('.tile').count(),8);assert.equal(await page.locator('iframe').count(),0);
  await page.screenshot({path:`artifacts/inicio-${viewport.width}.png`,fullPage:true});
  const routes=['clima','vuelos','noticias','caminos','excursiones','telefonos','agencias','enlaces'];
  for(const route of routes){await page.goto(`http://localhost:4173/#${route}`);await page.locator('h1').waitFor();if(await page.locator('#dynamic-content').count())await page.waitForFunction(()=>!document.querySelector('#dynamic-content .loading'),{},{timeout:26000});assert.equal(await page.locator('iframe').count(),0);assert.ok(await page.locator('.home-link').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} horizontal overflow ${viewport.width}`);results.push(`${viewport.width}px: ${route} navegación interna y sin desborde`);}
  await page.goto('http://localhost:4173/#excursiones');await page.getByRole('button',{name:'Día de lluvia',exact:true}).click();assert.equal(await page.locator('.card').count(),2);
  await page.getByRole('button',{name:'Sin auto',exact:true}).click();assert.equal(await page.locator('.card').count(),3);
  await page.goto('http://localhost:4173/#agencias');await page.getByRole('tab',{name:'Alquiler de autos',exact:true}).click();await page.getByRole('heading',{name:'Easy Rent a Car'}).waitFor();
  await page.getByRole('tab',{name:'Transporte',exact:true}).click();assert.equal(await page.locator('.card').count(),3);
  await page.goto('http://localhost:4173/#telefonos');await page.getByRole('button',{name:'Copiar',exact:true}).first().click();await page.getByText('Teléfono copiado',{exact:true}).waitFor();
  const hospital=page.locator('.card').filter({has:page.getByRole('heading',{name:'Hospital Dr. Ramón Carrillo'})});assert.equal(await hospital.locator('a[href^="tel:"]').count(),0);
  await page.getByRole('button',{name:'Salir',exact:false}).click();await page.locator('dialog[open]').waitFor();await page.getByRole('button',{name:'Volver a la app'}).click();assert.equal(await page.locator('dialog[open]').count(),0);
  await page.goto('http://localhost:4173/#vuelos');await page.waitForFunction(()=>!document.querySelector('#dynamic-content .loading'),{},{timeout:26000});await page.getByRole('tab',{name:'Salidas',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#dynamic-content .loading'),{},{timeout:26000});assert.ok((await page.locator('#dynamic-content').innerText()).includes('CPC'));
  await page.route('**/api/arrivals',r=>r.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'No se pudieron consultar los vuelos',detail:'Fallo de conexión simulado SOLO para esta prueba.'})}));
  await page.getByRole('tab',{name:'Llegadas',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#dynamic-content .loading'));assert.ok((await page.locator('#dynamic-content').innerText()).includes('No se pudieron consultar los vuelos'));assert.ok(!(await page.locator('#dynamic-content').innerText()).includes('No hay vuelos programados'));
  await page.goto('http://localhost:4173/#clima');await page.waitForFunction(()=>!document.querySelector('#dynamic-content .loading'),{},{timeout:26000});await context.setOffline(true);await page.getByRole('button',{name:'Actualizar',exact:false}).click();await page.waitForFunction(()=>!document.querySelector('#dynamic-content .loading'));assert.ok(await page.locator('#offline').isVisible());assert.ok((await page.locator('#dynamic-content').innerText()).includes('guardada'));await context.setOffline(false);
  results.push(`${viewport.width}px: filtros, pestañas, copiar, hospital sin llamada, salir, error de vuelos y clima guardado sin conexión`);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile('artifacts/browser-results.json',JSON.stringify({checkedAt:new Date().toISOString(),engine:'Google Chrome mediante Playwright; no Safari físico',results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors},null,2));
}finally{await browser.close();}
