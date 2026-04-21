package com.cotizador.screenplay.tasks;

import com.cotizador.screenplay.targets.UbicacionesTargets;
import com.cotizador.utils.ConfiguracionUI;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actions.Open;
import net.serenitybdd.screenplay.actions.SelectFromOptions;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Step;
import com.cotizador.screenplay.interactions.TriggerBlur;

import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isPresent;

public class PrepararFolioConUbicacion implements Task {

    private final String folio;

    private PrepararFolioConUbicacion(String folio) {
        this.folio = folio;
    }

    public static PrepararFolioConUbicacion enFolio(String folio) {
        return new PrepararFolioConUbicacion(folio);
    }

    @Override
    @Step("{0} prepara ubicación completa en folio {folio}")
    public <T extends Actor> void performAs(T actor) {
        // navegar a ubicaciones
        actor.attemptsTo(Open.url(ConfiguracionUI.url("/quotes/" + folio + "/locations")));

        // layout = 1
        actor.attemptsTo(
            Enter.theValue("1").into(UbicacionesTargets.INPUT_CANTIDAD),
            Click.on(UbicacionesTargets.BOTON_GUARDAR_LAYOUT)
        );

        // agregar ubicación
        actor.attemptsTo(Click.on(UbicacionesTargets.BOTON_AGREGAR_UBICACION));

        actor.attemptsTo(
            Enter.theValue("Oficina Central").into(UbicacionesTargets.INPUT_NOMBRE_UBICACION),
            Enter.theValue("Carrera 7 # 10-20").into(UbicacionesTargets.INPUT_DIRECCION),
            Enter.theValue("110111").into(UbicacionesTargets.INPUT_CP)
        );

        // Disparar blur en el campo CP para que el frontend llame al backend
        actor.attemptsTo(TriggerBlur.on(UbicacionesTargets.INPUT_CP));

        // Esperar a que aparezca el mensaje de CP válido (indica que la info ya cargó)
        actor.attemptsTo(
            WaitUntil.the(
                net.serenitybdd.screenplay.targets.Target.the("mensaje CP válido en PrepararFolio")
                    .locatedBy("//*[contains(text(),'CP válido')]"),
                isPresent()
            ).forNoMoreThan(10).seconds()
        );

        // seleccionar primer giro disponible
        actor.attemptsTo(
            SelectFromOptions.byIndex(1).from(UbicacionesTargets.SELECT_GIRO),
            SelectFromOptions.byValue("LADRILLO_CONCRETO").from(UbicacionesTargets.SELECT_TIPO_CONSTRUCTIVO),
            Enter.theValue("2010").into(UbicacionesTargets.INPUT_ANIO)
        );

        // garantía INCENDIO_EDIFICIOS — el label en el DOM es "Incendio - Edificio"
        actor.attemptsTo(
            Click.on(UbicacionesTargets.checkboxGarantiaPorLabel("Incendio - Edificio"))
        );

        actor.attemptsTo(Click.on(UbicacionesTargets.BOTON_GUARDAR_UBICACION));
    }
}
