package com.cotizador.screenplay.tasks;

import com.cotizador.screenplay.targets.FormularioTargets;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.SelectFromOptions;
import net.thucydides.core.annotations.Step;

public class SeleccionarOpcion implements Task {

    private final String campo;
    private final String valor;

    private SeleccionarOpcion(String campo, String valor) {
        this.campo = campo;
        this.valor = valor;
    }

    public static SeleccionarOpcion enCampo(String campo, String valor) {
        return new SeleccionarOpcion(campo, valor);
    }

    @Override
    @Step("{0} selecciona '{valor}' en {campo}")
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(
            SelectFromOptions.byValue(valor)
                .from(FormularioTargets.selectPorNombre(campo))
        );
    }
}
