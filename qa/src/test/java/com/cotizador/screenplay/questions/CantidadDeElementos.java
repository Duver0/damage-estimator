package com.cotizador.screenplay.questions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.targets.Target;

public class CantidadDeElementos implements Question<Integer> {

    private final Target target;

    private CantidadDeElementos(Target target) {
        this.target = target;
    }

    public static CantidadDeElementos de(Target target) {
        return new CantidadDeElementos(target);
    }

    @Override
    public Integer answeredBy(Actor actor) {
        try {
            return target.resolveAllFor(actor).size();
        } catch (Exception e) {
            return 0;
        }
    }
}
