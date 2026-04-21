package com.cotizador.features;

import io.cucumber.java.es.*;
import net.serenitybdd.screenplay.Actor;

import static net.serenitybdd.screenplay.actors.OnStage.theActorCalled;
import static org.assertj.core.api.Assertions.assertThat;

public class CalculoUIStepDefinitions {

    private static final long TIMEOUT_MS = 15_000;
    private static final long POLL_MS = 500;

    private Actor actor() {
        return theActorCalled("Usuario");
    }

    private double esperarPrimaMayorQueCero(String label) {
        long deadline = System.currentTimeMillis() + TIMEOUT_MS;
        double prima = 0.0;
        while (System.currentTimeMillis() < deadline) {
            prima = actor().asksFor(com.cotizador.screenplay.questions.PrimaPorLabel.de(label));
            if (prima > 0.0) return prima;
            try { Thread.sleep(POLL_MS); } catch (InterruptedException ignored) {}
        }
        return prima;
    }

    @Entonces("el resultado de prima neta es mayor que cero")
    public void verificarPrimaNetaMayorQueCero() {
        double prima = esperarPrimaMayorQueCero("Prima Neta");
        assertThat(prima).as("Prima Neta > 0").isGreaterThan(0.0);
    }

    @Entonces("el resultado de prima comercial es mayor que cero")
    public void verificarPrimaComercialMayorQueCero() {
        double prima = esperarPrimaMayorQueCero("Prima Comercial");
        assertThat(prima).as("Prima Comercial > 0").isGreaterThan(0.0);
    }

    @Entonces("la prima comercial es mayor que la prima neta")
    public void verificarPrimaComercialMayorQueNeta() {
        double neta = esperarPrimaMayorQueCero("Prima Neta");
        double comercial = esperarPrimaMayorQueCero("Prima Comercial");
        assertThat(comercial).as("Prima Comercial > Prima Neta").isGreaterThan(neta);
    }

    @Entonces("la página de términos muestra los valores de prima")
    public void verificarTerminosMuestranPrimas() {
        long deadline = System.currentTimeMillis() + TIMEOUT_MS;
        double valor = 0.0;
        while (System.currentTimeMillis() < deadline) {
            valor = actor().asksFor(com.cotizador.screenplay.questions.ValorNumericoEnPantalla.enElementosConClase("resultValue"));
            if (valor > 0.0) break;
            try { Thread.sleep(POLL_MS); } catch (InterruptedException ignored) {}
        }
        assertThat(valor).as("Al menos un valor de prima > 0 en términos").isGreaterThan(0.0);
    }
}
