package com.cotizador.features;

import com.cotizador.screenplay.questions.CantidadDeElementos;
import com.cotizador.screenplay.questions.UrlActual;
import com.cotizador.screenplay.targets.FormularioTargets;
import com.cotizador.screenplay.targets.UbicacionesTargets;
import com.cotizador.screenplay.tasks.CompletarCampo;
import com.cotizador.screenplay.tasks.NavegarA;
import com.cotizador.screenplay.tasks.SeleccionarOpcion;
import com.cotizador.screenplay.targets.CotizadorTargets;
import com.cotizador.utils.ConfiguracionUI;
import io.cucumber.java.After;
import io.cucumber.java.es.*;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.actions.Clear;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actions.Open;
import net.serenitybdd.screenplay.actors.OnStage;
import com.cotizador.screenplay.interactions.TriggerBlur;
import net.serenitybdd.screenplay.waits.WaitUntil;

import static net.serenitybdd.screenplay.actors.OnStage.theActorCalled;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isPresent;
import static org.assertj.core.api.Assertions.assertThat;

public class CommonUIStepDefinitions {

    private Actor actor() {
        return theActorCalled("Usuario");
    }

    // Scene setup handled by ScreenplayHooks

    @After
    public void cerrarEscenario() {
        OnStage.drawTheCurtain();
    }

    // ─── Background steps ────────────────────────────────────────────────────

    @Dado("que el usuario abre la aplicación en el dashboard")
    public void abrirDashboard() {
        actor().attemptsTo(NavegarA.elDashboard());
    }

    @Dado("que el usuario navega a la página del cotizador")
    public void navegarCotizador() {
        actor().attemptsTo(NavegarA.elCotizador());
    }

    @Dado("que existe un folio activo y el usuario está en datos generales")
    public void folioActivoEnDatosGenerales() {
        actor().attemptsTo(NavegarA.elCotizador());
        actor().attemptsTo(
            Enter.theValue("Test Corp").into(CotizadorTargets.INPUT_NOMBRE),
            Enter.theValue("test@corp.co").into(CotizadorTargets.INPUT_EMAIL),
            Enter.theValue("AG001").into(CotizadorTargets.INPUT_CODIGO_AGENTE),
            Click.on(CotizadorTargets.BOTON_CREAR_FOLIO)
        );
        actor().attemptsTo(
            WaitUntil.the(FormularioTargets.BOTON_SIGUIENTE, isPresent()).forNoMoreThan(15).seconds()
        );
    }

    @Dado("que existe un folio con datos generales completos y el usuario está en ubicaciones")
    public void folioConDatosGeneralesEnUbicaciones() {
        folioActivoEnDatosGenerales();
        actor().attemptsTo(Click.on(FormularioTargets.BOTON_SIGUIENTE));
        actor().attemptsTo(
            WaitUntil.the(UbicacionesTargets.INPUT_CANTIDAD, isPresent()).forNoMoreThan(15).seconds()
        );
    }

    @Dado("que el folio tiene una ubicación completa y el usuario está en información técnica")
    public void folioConUbicacionEnTechnicalInfo() {
        folioConDatosGeneralesEnUbicaciones();
        actor().attemptsTo(
            Enter.theValue("1").into(UbicacionesTargets.INPUT_CANTIDAD),
            Click.on(UbicacionesTargets.BOTON_GUARDAR_LAYOUT),
            Click.on(UbicacionesTargets.BOTON_AGREGAR_UBICACION),
            Enter.theValue("Sede Test").into(UbicacionesTargets.INPUT_NOMBRE_UBICACION),
            Enter.theValue("Carrera 7 # 10-20").into(UbicacionesTargets.INPUT_DIRECCION),
            Enter.theValue("110111").into(UbicacionesTargets.INPUT_CP)
        );
          // Disparar blur para validar el CP contra el backend
          actor().attemptsTo(TriggerBlur.on(UbicacionesTargets.INPUT_CP));
        // Esperar a que aparezca el mensaje de CP válido
        actor().attemptsTo(
            WaitUntil.the(
                net.serenitybdd.screenplay.targets.Target.the("mensaje CP válido en background")
                    .locatedBy("//*[contains(text(),'CP válido')]"),
                isPresent()
            ).forNoMoreThan(15).seconds()
        );
        actor().attemptsTo(
            net.serenitybdd.screenplay.actions.SelectFromOptions.byIndex(1).from(UbicacionesTargets.SELECT_GIRO),
            net.serenitybdd.screenplay.actions.SelectFromOptions.byValue("LADRILLO_CONCRETO").from(UbicacionesTargets.SELECT_TIPO_CONSTRUCTIVO),
            Enter.theValue("2010").into(UbicacionesTargets.INPUT_ANIO),
            Click.on(UbicacionesTargets.checkboxGarantiaPorLabel("Incendio - Edificio")),
            Click.on(UbicacionesTargets.BOTON_GUARDAR_UBICACION)
        );
        actor().attemptsTo(
            WaitUntil.the(FormularioTargets.BOTON_SIGUIENTE, isPresent()).forNoMoreThan(10).seconds()
        );
        actor().attemptsTo(Click.on(FormularioTargets.BOTON_SIGUIENTE));
        actor().attemptsTo(
            WaitUntil.the(net.serenitybdd.screenplay.targets.Target.the("calcular")
                .located(org.openqa.selenium.By.cssSelector("[class*='calcBtn']")), isPresent()).forNoMoreThan(15).seconds()
        );
    }

    // ─── Generic action steps ─────────────────────────────────────────────────

    @Cuando("hace clic en el botón {string}")
    public void hacerClicEnBoton(String texto) {
        hacerClicEnTexto(texto);
    }

    @Cuando("hace clic en {string}")
    public void hacerClicEnTexto(String texto) {
        actor().attemptsTo(
            Click.on(net.serenitybdd.screenplay.targets.Target.the("botón " + texto)
                .locatedBy("//button[contains(normalize-space(),'" + texto + "')] | //a[contains(normalize-space(),'" + texto + "')]"))
        );
    }

    // ─── Form steps (shared across datos_generales, cotizador) ───────────────

    @Cuando("completa el campo {string} con {string}")
    public void completarCampo(String campo, String valor) {
        actor().attemptsTo(CompletarCampo.con(campo, valor));
    }

    @Cuando("borra el contenido del campo {string}")
    public void borrarCampo(String campo) {
        var target = FormularioTargets.inputPorNombre(campo);
        actor().attemptsTo(
            Click.on(target),
            Clear.field(target)
        );
    }

    @Cuando("selecciona {string} en el campo {string}")
    public void seleccionarEnCampo(String valor, String campo) {
        actor().attemptsTo(SeleccionarOpcion.enCampo(campo, valor));
    }

    // ─── URL / redirect assertion steps ─────────────────────────────────────

    @Entonces("la URL contiene {string}")
    public void verificarUrlContiene(String fragmento) {
        long deadline = System.currentTimeMillis() + 15_000;
        String url = "";
        while (System.currentTimeMillis() < deadline) {
            url = UrlActual.delNavegador().answeredBy(actor());
            if (url.contains(fragmento)) break;
            try { Thread.sleep(500); } catch (InterruptedException ignored) {}
        }
        assertThat(url).as("URL actual").contains(fragmento);
    }

    @Entonces("es redirigido a la página de datos generales")
    public void redirigidoADatosGenerales() {
        verificarUrlContiene("general-info");
    }

    @Entonces("es redirigido a la página de ubicaciones")
    public void redirigidoAUbicaciones() {
        verificarUrlContiene("locations");
    }

    @Entonces("es redirigido a la página de información técnica")
    public void redirigidoAInformacionTecnica() {
        verificarUrlContiene("technical-info");
    }

    @Entonces("es redirigido a la página de términos y confirmación")
    public void redirigidoATerminos() {
        verificarUrlContiene("terms");
    }

    @Entonces("permanece en la página del cotizador")
    public void permaneceCotizador() {
        verificarUrlContiene("cotizador");
    }

    @Entonces("permanece en la página de datos generales")
    public void permaneceDatosGenerales() {
        verificarUrlContiene("general-info");
    }
}
