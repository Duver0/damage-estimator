package com.cotizador.utils;

import net.thucydides.core.environment.SystemEnvironmentVariables;
import net.thucydides.core.util.EnvironmentVariables;

public final class ConfiguracionUI {

    private ConfiguracionUI() {}

    public static String frontendUrl() {
        String sys = System.getProperty("frontend.url");
        if (sys != null && !sys.isBlank()) return sys;
        EnvironmentVariables env = SystemEnvironmentVariables.createEnvironmentVariables();
        String conf = env.getProperty("frontend.url");
        return conf != null ? conf : "http://localhost:5173";
    }

    public static String url(String path) {
        String base = frontendUrl();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + path;
    }
}
