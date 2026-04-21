package com.cotizador.features;

import com.cotizador.screenplay.questions.CantidadDeElementos;
import com.cotizador.screenplay.targets.CotizadorTargets;
import com.cotizador.screenplay.targets.FormularioTargets;
import io.cucumber.java.es.*;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;

import static net.serenitybdd.screenplay.actors.OnStage.theActorCalled;
import static org.assertj.core.api.Assertions.assertThat;

public class CotizadorStepDefinitions {

    private Actor actor() {
        return theActorCalled("Usuario");
    }

    @Cuando("ingresa el nombre del asegurado {string}")
    public void ingresarNombre(String nombre) {
        actor().attemptsTo(Enter.theValue(nombre).into(CotizadorTargets.INPUT_NOMBRE));
    }

    @Cuando("ingresa el correo {string}")
    public void ingresarCorreo(String correo) {
        actor().attemptsTo(Enter.theValue(correo).into(CotizadorTargets.INPUT_EMAIL));
    }

    @Cuando("ingresa el código de agente {string}")
    public void ingresarCodigoAgente(String codigo) {
        actor().attemptsTo(Enter.theValue(codigo).into(CotizadorTargets.INPUT_CODIGO_AGENTE));
    }

    @Cuando("hace clic en el botón {string} sin completar campos")
    public void hacerClicSinCampos(String boton) {
        actor().attemptsTo(Click.on(CotizadorTargets.BOTON_CREAR_FOLIO));
    }

    @Entonces("el número de folio aparece en el encabezado")
    public void folioEnEncabezado() {
        int count = CantidadDeElementos.de(FormularioTargets.ENCABEZADO_FOLIO).answeredBy(actor());
        assertThat(count).as("Folio visible en encabezado").isGreaterThan(0);
    }

    @Dado("que existen cotizaciones previas en el sistema")
    public void existenCotizacionesPrevias() {
        // Las cotizaciones recientes se cargan automáticamente desde el backend
    }

    @Entonces("el panel de cotizaciones recientes es visible")
    public void panelRecientesVisible() {
        int count = CantidadDeElementos.de(CotizadorTargets.PANEL_COTIZACIONES_RECIENTES).answeredBy(actor());
        assertThat(count).as("Panel de cotizaciones recientes").isGreaterThan(0);
    }
}
