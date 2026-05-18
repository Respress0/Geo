#!/bin/bash

# Script to build Android APK for Task Manager app

echo "=== Building Android APK for Task Manager ==="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed."
    exit 1
fi

# Install required Python packages
echo "Installing Python dependencies..."
pip3 install flask flask-cors pyinstaller --quiet

# Create Android project structure
mkdir -p android_app/assets
cp index.html styles.css app.js server.py android_app/assets/

# Create a simple Android WebView app wrapper
cat > android_app/MainActivity.java << 'JAVAEOF'
package com.taskmanager;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
    }
}
JAVAEOF

# Create AndroidManifest.xml
cat > android_app/AndroidManifest.xml << 'XMLEOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.taskmanager">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="Task Manager"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
XMLEOF

echo ""
echo "=== Project files created successfully! ==="
echo ""
echo "Files created:"
echo "  - index.html (HTML structure)"
echo "  - styles.css (CSS styles)"  
echo "  - app.js (JavaScript logic)"
echo "  - server.py (Flask backend with SQLite)"
echo "  - android_app/ (Android project structure)"
echo ""
echo "To run the web app locally:"
echo "  python3 server.py"
echo "  Then open http://localhost:5000 in your browser"
echo ""
echo "To build the APK, you need Android SDK and Build Tools installed."
echo "Alternative: Use a service like Cordova, Capacitor, or Bubblewrap"
echo "to convert the web app to an Android APK."
echo ""
