package com.llmhouse.app;

import android.content.Intent;
import android.provider.AlarmClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Calendar;

@CapacitorPlugin(name = "SystemAlarm")
public class SystemAlarmPlugin extends Plugin {

    @PluginMethod
    public void setAlarm(PluginCall call) {
        String title = call.getString("title", "闹钟");
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        Boolean skipUi = call.getBoolean("skipUi", false);
        String repeat = call.getString("repeat", "none");

        if (hour == null || minute == null) {
            call.reject("小时和分钟参数必填");
            return;
        }

        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
            intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
            intent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
            intent.putExtra(AlarmClock.EXTRA_MESSAGE, title);
            intent.putExtra(AlarmClock.EXTRA_SKIP_UI, skipUi);

            // 处理重复模式
            if (!repeat.equals("none")) {
                ArrayList<Integer> days = new ArrayList<>();
                switch (repeat) {
                    case "daily":
                        // 每天：周一到周日
                        days.add(Calendar.MONDAY);
                        days.add(Calendar.TUESDAY);
                        days.add(Calendar.WEDNESDAY);
                        days.add(Calendar.THURSDAY);
                        days.add(Calendar.FRIDAY);
                        days.add(Calendar.SATURDAY);
                        days.add(Calendar.SUNDAY);
                        break;
                    case "weekday":
                        // 工作日：周一到周五
                        days.add(Calendar.MONDAY);
                        days.add(Calendar.TUESDAY);
                        days.add(Calendar.WEDNESDAY);
                        days.add(Calendar.THURSDAY);
                        days.add(Calendar.FRIDAY);
                        break;
                    case "weekend":
                        // 周末：周六周日
                        days.add(Calendar.SATURDAY);
                        days.add(Calendar.SUNDAY);
                        break;
                }
                if (!days.isEmpty()) {
                    intent.putExtra(AlarmClock.EXTRA_DAYS, days);
                }
            }

            // 设置振动
            intent.putExtra(AlarmClock.EXTRA_VIBRATE, true);

            getActivity().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "成功打开系统闹钟");
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("设置系统闹钟失败: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showAlarms(PluginCall call) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
            getActivity().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "成功打开闹钟列表");
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("打开闹钟列表失败: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setTimer(PluginCall call) {
        Integer seconds = call.getInt("seconds");
        String message = call.getString("message", "倒计时");
        Boolean skipUi = call.getBoolean("skipUi", false);

        if (seconds == null) {
            call.reject("秒数参数必填");
            return;
        }

        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER);
            intent.putExtra(AlarmClock.EXTRA_LENGTH, seconds);
            intent.putExtra(AlarmClock.EXTRA_MESSAGE, message);
            intent.putExtra(AlarmClock.EXTRA_SKIP_UI, skipUi);

            getActivity().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "成功设置倒计时");
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("设置倒计时失败: " + e.getMessage());
        }
    }
}

