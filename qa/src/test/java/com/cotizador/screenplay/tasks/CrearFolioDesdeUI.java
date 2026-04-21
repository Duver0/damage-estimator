package com.cotizador.screenplay.tasks;

import com.cotizador.screenplay.targets.CotizadorTargets;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.thucydides.core.annotations.Step;

public class CrearFolioDesdeUI implements Task {

    private final String nombre;
    private final String email;
    private final String agente;

    private CrearFolioDesdeUI(String nombre, String email, String agente) {
        this.nombre = nombre;
        this.email = email;
        this.agente = agente;
    }

    public static CrearFolioDesdeUI con(String nombre, String email, String agente) {
        return new CrearFolioDesdeUI(nombre, email, agente);
    }

    @Override
    @Step("{0} crea folio para {nombre} con agente {agente}")
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(
            Enter.theValue(nombre).into(CotizadorTargets.INPUT_NOMBRE),
            Enter.theValue(email).into(CotizadorTargets.INPUT_EMAIL),
            Enter.theValue(agente).into(CotizadorTargets.INPUT_CODIGO_AGENTE),
            Click.on(CotizadorTargets.BOTON_CREAR_FOLIO)
        );
    }
}
