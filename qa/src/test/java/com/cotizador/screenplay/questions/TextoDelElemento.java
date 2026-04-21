package com.cotizador.screenplay.questions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.targets.Target;

public class TextoDelElemento implements Question<String> {

    private final Target target;

    private TextoDelElemento(Target target) {
        this.target = target;
    }

    public static TextoDelElemento de(Target target) {
        return new TextoDelElemento(target);
    }

    @Override
    public String answeredBy(Actor actor) {
        try {
            return target.resolveFor(actor).getText();
        } catch (Exception e) {
            return "";
        }
    }
}
