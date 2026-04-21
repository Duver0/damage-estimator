package com.cotizador.screenplay.questions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.targets.Target;

import java.util.List;

public class ExisteTextoEnTarget implements Question<Boolean> {

    private final Target target;
    private final String texto;

    private ExisteTextoEnTarget(Target target, String texto) {
        this.target = target;
        this.texto = texto;
    }

    public static ExisteTextoEnTarget en(Target target, String texto) {
        return new ExisteTextoEnTarget(target, texto);
    }

    @Override
    public Boolean answeredBy(Actor actor) {
        try {
            List<?> elements = target.resolveAllFor(actor);
            for (Object obj : elements) {
                try {
                    org.openqa.selenium.WebElement el = (org.openqa.selenium.WebElement) obj;
                    if (el.getText() != null && el.getText().contains(texto)) return true;
                } catch (ClassCastException ignored) {}
            }
        } catch (Exception ignored) {}
        return false;
    }
}
