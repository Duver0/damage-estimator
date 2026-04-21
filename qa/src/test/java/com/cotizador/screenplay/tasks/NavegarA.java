package com.cotizador.screenplay.tasks;

import com.cotizador.utils.ConfiguracionUI;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Open;
import net.thucydides.core.annotations.Step;

public class NavegarA implements Task {

    private final String path;

    private NavegarA(String path) {
        this.path = path;
    }

    public static NavegarA elDashboard() { return new NavegarA("/dashboard"); }
    public static NavegarA elCotizador() { return new NavegarA("/cotizador"); }
    public static NavegarA laRuta(String path) { return new NavegarA(path); }

    @Override
    @Step("{0} navega a {path}")
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(Open.url(ConfiguracionUI.url(path)));
    }
}
