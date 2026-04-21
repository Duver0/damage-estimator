package com.cotizador.features;

import io.cucumber.java.Before;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.actors.OnlineCast;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;
import net.thucydides.core.annotations.Managed;
import org.openqa.selenium.WebDriver;

public class ScreenplayHooks {

    @Managed
    private WebDriver browser;

    @Before(order = 0)
    public void prepararEscenario() {
        OnStage.setTheStage(new OnlineCast());
        OnStage.theActorCalled("Usuario").can(BrowseTheWeb.with(browser));
    }
}
