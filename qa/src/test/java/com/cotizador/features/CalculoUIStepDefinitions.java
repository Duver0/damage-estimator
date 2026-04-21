package com.cotizador.features;

import io.cucumber.java.es.*;
import net.serenitybdd.screenplay.Actor;

import static net.serenitybdd.screenplay.actors.OnStage.theActorCalled;
import static org.assertj.core.api.Assertions.assertThat;

public class CalculoUIStepDefinitions {

    private Actor actor() {
        return theActorCalled("Usuario");
    }

    @Entonces("el resultado de prima neta es mayor que cero")
    public void verificarPrimaNetaMayorQueCero() {
        double prima = actor().asksFor(com.cotizador.screenplay.questions.PrimaPorLabel.de("Prima Neta"));
        assertThat(prima).as("Prima Neta > 0").isGreaterThan(0.0);
    }

    @Entonces("el resultado de prima comercial es mayor que cero")
    public void verificarPrimaComercialMayorQueCero() {
        double prima = actor().asksFor(com.cotizador.screenplay.questions.PrimaPorLabel.de("Prima Comercial"));
        assertThat(prima).as("Prima Comercial > 0").isGreaterThan(0.0);
    }

    @Entonces("la prima comercial es mayor que la prima neta")
    public void verificarPrimaComercialMayorQueNeta() {
        double neta = actor().asksFor(com.cotizador.screenplay.questions.PrimaPorLabel.de("Prima Neta"));
        double comercial = actor().asksFor(com.cotizador.screenplay.questions.PrimaPorLabel.de("Prima Comercial"));
        assertThat(comercial).as("Prima Comercial > Prima Neta").isGreaterThan(neta);
    }

    @Entonces("la página de términos muestra los valores de prima")
    public void verificarTerminosMuestranPrimas() {
        double valor = actor().asksFor(com.cotizador.screenplay.questions.ValorNumericoEnPantalla.enElementosConClase("resultValue"));
        assertThat(valor).as("Al menos un valor de prima > 0 en términos").isGreaterThan(0.0);
    }
}
