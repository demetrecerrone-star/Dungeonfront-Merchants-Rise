package com.dabski.dungeonfront;
import android.app.Activity;
import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
/** Offline WebView host that retains Android system navigation and display-cutout safe areas. */
public final class MainActivity extends Activity {
 private WebView gameView;
 @SuppressLint("SetJavaScriptEnabled")
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  getWindow().setStatusBarColor(Color.rgb(8,12,14));
  getWindow().setNavigationBarColor(Color.rgb(8,12,14));
  getWindow().setFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  FrameLayout root=new FrameLayout(this);
  root.setBackgroundColor(Color.rgb(8,12,14));
  root.setOnApplyWindowInsetsListener((view,insets)->{
   if(Build.VERSION.SDK_INT>=30){
    android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
    view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
   }else{
    view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   }
   return insets;
  });
  gameView=new WebView(this);
  gameView.setBackgroundColor(Color.rgb(8,12,14));
  WebSettings settings=gameView.getSettings();
  settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(true);settings.setMediaPlaybackRequiresUserGesture(false);
  settings.setDefaultTextEncodingName("UTF-8");settings.setBuiltInZoomControls(false);
  settings.setDisplayZoomControls(false);
  gameView.setWebViewClient(new WebViewClient());gameView.setWebChromeClient(new WebChromeClient());
  gameView.setOverScrollMode(View.OVER_SCROLL_NEVER);
  root.addView(gameView,new FrameLayout.LayoutParams(-1,-1));
  setContentView(root);root.requestApplyInsets();
  gameView.loadUrl("file:///android_asset/index.html");
 }
 @Override public void onBackPressed() {
  if(gameView==null){super.onBackPressed();return;}
  gameView.evaluateJavascript("Boolean(window.Dungeonfront && window.Dungeonfront.handleBack())",
   result->{if(!"true".equals(result))finish();});
 }
 @Override protected void onPause(){
  if(gameView!=null)gameView.evaluateJavascript("window.dispatchEvent(new Event('pagehide'));",null);
  super.onPause();
 }
 @Override protected void onDestroy(){
  if(gameView!=null){gameView.destroy();gameView=null;}
  super.onDestroy();
 }
}
