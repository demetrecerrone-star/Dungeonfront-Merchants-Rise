package com.dabski.dungeonfront;

import android.app.Activity;
import android.graphics.Bitmap;
import android.content.ContentValues;
import android.net.Uri;
import android.provider.MediaStore;
import android.os.SystemClock;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.OutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.*;

/**
 * Real Android WebView smoke tests (API 35, landscape).
 * Screenshots: MediaStore Pictures/DungeonfrontQA/qa-*.png (survive test APK uninstall)
 * No network permissions, no signing keys, no APK release and no save-key changes.
 */
@RunWith(AndroidJUnit4.class)
public final class VisualSmokeTest {
    private ActivityScenario<MainActivity> scenario;
    private WebView webView;
    private MainActivity activity;

    @Before public void launch() {
        scenario = ActivityScenario.launch(MainActivity.class);
        scenario.onActivity(a -> {
            activity = a;
            webView = searchWebView(a.getWindow().getDecorView());
        });
        assertNotNull("MainActivity must contain a WebView", webView);
        waitFor("Boolean(window.Dungeonfront && document.readyState==='complete')", 25000);
        eval("window.Dungeonfront.skipIntro();window.Dungeonfront.start();true");
        waitFor("Boolean(!document.getElementById('game').classList.contains('hidden') && document.getElementById('panelContent').children.length>0)", 12000);
    }

    @After public void close() {
        if(scenario != null) scenario.close();
    }

    private static WebView searchWebView(View v) {
        if (v instanceof WebView) return (WebView)v;
        if (v instanceof ViewGroup) {
            ViewGroup g = (ViewGroup)v;
            for(int i=0;i<g.getChildCount();i++) {
                WebView found = searchWebView(g.getChildAt(i));
                if(found!=null)return found;
            }
        }
        return null;
    }
    private String eval(String js) {
        final AtomicReference<String> output = new AtomicReference<>("null");
        final CountDownLatch latch = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            webView.evaluateJavascript("(function(){return eval(" + org.json.JSONObject.quote(js) + ");})()", value -> {
                output.set(value);latch.countDown();
            })
        );
        try {
            assertTrue("JavaScript callback timed out: " + js, latch.await(10,TimeUnit.SECONDS));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();throw new AssertionError(e);
        }
        return output.get();
    }
    private void waitFor(String expr, int maxMs) {
        long deadline=SystemClock.elapsedRealtime()+maxMs;
        do {
            if("true".equals(eval(expr)))return;
            SystemClock.sleep(200);
        } while(SystemClock.elapsedRealtime()<deadline);
        fail("WebView never satisfied: " + expr + " (last="+eval(expr)+")");
    }
    private void screenshot(String tag) {
        Bitmap bitmap=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        assertNotNull("No emulator framebuffer",bitmap);
        Uri mediaUri=null;
        try {
            ContentValues props=new ContentValues();
            props.put(MediaStore.MediaColumns.DISPLAY_NAME,"qa-"+tag+".png");
            props.put(MediaStore.MediaColumns.MIME_TYPE,"image/png");
            props.put(MediaStore.MediaColumns.RELATIVE_PATH,"Pictures/DungeonfrontQA");
            mediaUri=activity.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,props);
            assertNotNull("Cannot reserve screenshot in shared Pictures folder",mediaUri);
            try(OutputStream out=activity.getContentResolver().openOutputStream(mediaUri)){
                assertNotNull("Cannot write screenshot file",out);
                assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG,100,out));
            }
            android.util.Log.i("DungeonfrontQA","Captured MediaStore: "+mediaUri
                +" size="+bitmap.getWidth()+"x"+bitmap.getHeight());
        }catch(Exception e){
            if(mediaUri!=null)activity.getContentResolver().delete(mediaUri,null,null);
            throw new AssertionError("Could not save "+tag+" screenshot",e);
        }finally{bitmap.recycle();}
    }

    @Test public void shopLoadsWithAssetsAndLandscapeGeometry() {
        assertEquals("true",eval("Boolean(window.DFSprites&&window.DFDungeon&&window.DFContracts)"));
        assertEquals("true",eval("Boolean(document.getElementById('scene').width===800&&document.getElementById('scene').height===440)"));
        waitFor("Boolean(window.DFSprites.status().ready>=18 && window.DFSprites.eventReadyCount()===10)",15000);
        assertEquals("true",eval("Boolean(innerWidth>innerHeight && document.getElementById('scene').getBoundingClientRect().width>120)"));
        assertEquals("true",eval("Boolean(!document.getElementById('tickerText').textContent.includes('interface error'))"));
        screenshot("shop");
    }

    @Test public void contractBoardHasNoHorizontalClippingAndNoEarlyClaim() {
        eval("document.getElementById('contractsButton').click();true");
        waitFor("Boolean(!document.getElementById('contractBoard').classList.contains('hidden'))",5000);
        assertEquals("true",eval("Boolean(document.querySelectorAll('.contract-offer').length>=5)"));
        assertEquals("true",eval("Boolean(document.getElementById('contractBoard').getBoundingClientRect().right<=innerWidth+3)"));
        assertEquals("true",eval("Boolean(document.querySelectorAll('[data-contract-action=claim]').length===0)"));
        screenshot("contracts");
    }

    @Test public void hireRosterShowsClassIconsAndInjuryIndicators() {
        eval("document.getElementById('contractsButton').click();true");
        assertEquals("true",eval("Boolean(document.querySelector('[data-contract-action=hire]'))"));
        eval("document.querySelector('[data-contract-action=hire]').click();true");
        eval("document.getElementById('boardRoster').click();true");
        waitFor("Boolean(!document.getElementById('rosterScreen').classList.contains('hidden') && document.querySelector('.roster-entry'))",5000);
        assertEquals("true",eval("Boolean(document.querySelector('.roster-entry .class-icon') && document.querySelector('.roster-mini-fatigue'))"));
        assertEquals("true",eval("Boolean(document.getElementById('rosterScreen').getBoundingClientRect().right<=innerWidth+3)"));
        assertEquals("true",eval("Boolean(!document.getElementById('rosterScreen').scrollWidth || document.getElementById('rosterScreen').scrollWidth<=document.getElementById('rosterScreen').clientWidth+3)"));
        waitFor("Boolean(document.querySelector('.roster-entry .class-icon').complete && document.querySelector('.roster-entry .class-icon').naturalWidth===16)",8000);
        screenshot("roster");
    }

    @Test public void dungeonDrawsAndRendersAnimatedDiscoveries() {
        // Enter the public dungeon via its real canvas pointer gesture.
        String open="(function(){const c=document.getElementById('scene'),r=c.getBoundingClientRect(),x=r.left+145*r.width/800,y=r.top+267*r.height/440;for(const type of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:13,clientX:x,clientY:y}));return true;})()";
        eval(open);
        waitFor("Boolean(!document.getElementById('dungeonControls').classList.contains('hidden'))",6000);
        assertEquals("true",eval("Boolean(window.DFSprites && window.DFSprites.eventReadyCount()===10)"));
        assertEquals("true",eval("Boolean(document.getElementById('scene').getBoundingClientRect().width>100)"));
        assertEquals("true",eval("Boolean(!document.getElementById('tickerText').textContent.includes('interface error'))"));
        // Watch a measurable WebView rAF sample. Log rather than impose a brittle
        // speed limit on GitHub's shared/virtualized GPU hosts.
        eval("window.__qaFrames=0;window.__qaStart=performance.now();window.__qaDone=false;(function spin(){window.__qaFrames++;if(performance.now()-window.__qaStart<1300)requestAnimationFrame(spin);else{window.__qaFps=window.__qaFrames/((performance.now()-window.__qaStart)/1000);window.__qaDone=true;}})();true");
        waitFor("window.__qaDone===true",6500);
        android.util.Log.i("DungeonfrontQA","Dungeon requestAnimationFrame FPS="+eval("Number(window.__qaFps.toFixed(1))"));
        assertEquals("true",eval("Boolean(window.__qaFrames>4)"));
        screenshot("dungeon");
    }
    @Test public void modernRendererDefaultsOffAndLegacyFallbackSurvivesMissingAtlas() {
        // Modern character art must NEVER switch on or request assets by itself.
        assertEquals("true", eval("Boolean(window.DFModernSprites && window.DFModernSprites.isEnabled()===false)"));
        assertEquals("true", eval("Boolean(window.DFModernSprites.status().loaded===0 && window.DFModernSprites.status().failed===0)"));
        assertEquals("true", eval("Boolean(window.DFSprites.status().ready>=18)"));

        // Simulate future opt-in before art production. The missing v2 sheet
        // must fail safely and v1 actor art must remain ready and drawable.
        eval("window.DFModernSprites.setEnabled(true);true");
        assertEquals("false", eval("window.DFModernSprites.draw(document.getElementById('scene').getContext('2d'),{cls:'Knight',hp:100,status:'exploring',swing:0},0)"));
        waitFor("Boolean(window.DFModernSprites.status().failed>=1)",8000);
        assertEquals("true", eval("Boolean(window.DFSprites.status().ready>=18 && window.DFModernSprites.status().loaded===0)"));
        eval("window.DFModernSprites.setEnabled(false);true");
        assertEquals("true", eval("Boolean(window.DFModernSprites.isEnabled()===false && !document.getElementById('tickerText').textContent.includes('interface error'))"));
        screenshot("modern-safe-fallback");
    }

}
