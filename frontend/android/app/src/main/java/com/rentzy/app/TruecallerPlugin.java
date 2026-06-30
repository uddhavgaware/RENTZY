package com.rentzy.app;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.truecaller.android.sdk.ITrueCallback;
import com.truecaller.android.sdk.TrueError;
import com.truecaller.android.sdk.TrueProfile;
import com.truecaller.android.sdk.TruecallerSDK;
import com.truecaller.android.sdk.TruecallerSdkScope;

@CapacitorPlugin(name = "Truecaller")
public class TruecallerPlugin extends Plugin {

    private PluginCall savedCall;

    @Override
    public void load() {
        super.load();
        
        TruecallerSdkScope trueScope = new TruecallerSdkScope.Builder(getContext(), sdkCallback)
                .consentMode(TruecallerSdkScope.CONSENT_MODE_BOTTOMSHEET)
                .buttonColor(android.graphics.Color.parseColor("#2F5299"))
                .buttonTextColor(android.graphics.Color.WHITE)
                .loginTextPrefix(R.string.login_text_prefix)
                .loginTextSuffix(R.string.login_text_suffix)
                .ctaTextPrefix(TruecallerSdkScope.CTA_TEXT_PREFIX_USE)
                .buttonShapeOptions(TruecallerSdkScope.BUTTON_SHAPE_ROUNDED)
                .privacyPolicyUrl("https://rentxy.in/privacy-policy")
                .termsOfServiceUrl("https://rentxy.in/terms")
                .footerType(TruecallerSdkScope.FOOTER_TYPE_NONE)
                .consentTitleOption(TruecallerSdkScope.SDK_CONSENT_TITLE_LOG_IN)
                .build();

        TruecallerSDK.init(trueScope);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (!TruecallerSDK.getInstance().isUsable()) {
            call.reject("Truecaller app not installed or usable.");
            return;
        }
        
        savedCall = call;
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }
        if (activity instanceof FragmentActivity) {
            TruecallerSDK.getInstance().getUserProfile((FragmentActivity) activity);
        } else {
            call.reject("Activity is not a FragmentActivity — cannot start Truecaller login.");
        }
    }

    private final ITrueCallback sdkCallback = new ITrueCallback() {
        @Override
        public void onSuccessProfileShared(@NonNull TrueProfile trueProfile) {
            if (savedCall != null) {
                JSObject result = new JSObject();
                result.put("firstName", trueProfile.firstName);
                result.put("lastName", trueProfile.lastName);
                result.put("phoneNumber", trueProfile.phoneNumber);
                result.put("gender", trueProfile.gender);
                result.put("email", trueProfile.email);
                result.put("avatarUrl", trueProfile.avatarUrl);
                result.put("payload", trueProfile.payload);
                result.put("signature", trueProfile.signature);
                result.put("signatureAlgorithm", trueProfile.signatureAlgorithm);
                
                savedCall.resolve(result);
                savedCall = null;
            }
        }

        @Override
        public void onFailureProfileShared(@NonNull TrueError trueError) {
            if (savedCall != null) {
                savedCall.reject("Truecaller error: " + trueError.getErrorType());
                savedCall = null;
            }
        }

        @Override
        public void onVerificationRequired(@Nullable TrueError trueError) {
            if (savedCall != null) {
                savedCall.reject("Verification required, not supported in this flow.");
                savedCall = null;
            }
        }
    };

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        Activity activity = getActivity();
        if (activity instanceof FragmentActivity) {
            TruecallerSDK.getInstance().onActivityResultObtained((FragmentActivity) activity, requestCode, resultCode, data);
        } else {
            Log.e("TruecallerPlugin", "Activity is not a FragmentActivity, cannot pass to onActivityResultObtained");
        }
    }
}
