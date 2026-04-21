package com.cotizador.screenplay.tasks;

import com.cotizador.screenplay.targets.FormularioTargets;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Clear;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actions.SelectFromOptions;
import net.thucydides.core.annotations.Step;

public class CompletarCampo implements Task {

    private final String campo;
    private final String valor;

    private CompletarCampo(String campo, String valor) {
        this.campo = campo;
        this.valor = valor;
    }

    public static CompletarCampo con(String campo, String valor) {
        return new CompletarCampo(campo, valor);
    }

    @Override
    @Step("{0} completa {campo} con '{valor}'")
    public <T extends Actor> void performAs(T actor) {
        var target = FormularioTargets.inputPorNombre(campo);
        actor.attemptsTo(
            Click.on(target),
            Clear.field(target),
            Enter.theValue(valor).into(target)
        );
    }
}
