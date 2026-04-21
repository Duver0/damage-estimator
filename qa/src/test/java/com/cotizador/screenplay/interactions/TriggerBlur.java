package com.cotizador.screenplay.interactions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Interaction;
import net.serenitybdd.screenplay.targets.Target;
import net.thucydides.core.annotations.Step;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.Keys;

public class TriggerBlur implements Interaction {

    private final Target target;

    private TriggerBlur(Target target) {
        this.target = target;
    }

    public static TriggerBlur on(Target target) {
        return new TriggerBlur(target);
    }

    @Override
    @Step("{0} provoca blur en el elemento")
    public <T extends Actor> void performAs(T actor) {
        try {
            WebElement el = target.resolveFor(actor);
            el.sendKeys(Keys.TAB);
        } catch (Exception ignored) {}
    }
}
