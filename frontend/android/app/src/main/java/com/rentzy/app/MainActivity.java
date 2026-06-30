package com.rentzy.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TruecallerPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (com.truecaller.android.sdk.TruecallerSDK.getInstance().isUsable()) {
            com.truecaller.android.sdk.TruecallerSDK.getInstance().onActivityResultObtained(this, requestCode, resultCode, data);
        }
    }
}
