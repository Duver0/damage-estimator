package com.cotizador.screenplay.targets;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class UbicacionesTargets {

    public static final Target INPUT_CANTIDAD = Target.the("campo cantidad de ubicaciones")
            .located(By.cssSelector("input[name='cantidad']"));

    public static final Target BOTON_GUARDAR_LAYOUT = Target.the("botón Guardar Layout")
            .located(By.cssSelector("[class*='actionBtn']"));

    public static final Target BOTON_AGREGAR_UBICACION = Target.the("botón agregar ubicación")
            .located(By.cssSelector("[class*='addBtn']"));

    public static final Target INPUT_NOMBRE_UBICACION = Target.the("campo nombre de ubicación")
            .located(By.cssSelector("input[name='nombre_ubicacion']"));

    public static final Target INPUT_DIRECCION = Target.the("campo dirección")
            .located(By.cssSelector("input[name='direccion']"));

    public static final Target INPUT_CP = Target.the("campo código postal")
            .located(By.cssSelector("input[name='codigo_postal']"));

    public static final Target SELECT_GIRO = Target.the("selector de giro")
            .located(By.cssSelector("select[name='giro']"));

    public static final Target SELECT_TIPO_CONSTRUCTIVO = Target.the("selector tipo constructivo")
            .located(By.cssSelector("select[name='tipo_constructivo']"));

    public static final Target INPUT_ANIO = Target.the("campo año de construcción")
            .located(By.cssSelector("input[name='anio_construccion']"));

    public static final Target BOTON_GUARDAR_UBICACION = Target.the("botón Guardar Ubicación")
            .located(By.cssSelector("[class*='saveBtn']"));

    public static final Target BOTON_CANCELAR = Target.the("botón Cancelar")
            .located(By.cssSelector("[class*='cancelBtn']"));

    public static final Target CARDS_UBICACION = Target.the("tarjetas de ubicaciones")
            .located(By.cssSelector("[class*='card']"));

    public static Target checkboxGarantia(String codigo) {
        return Target.the("garantía " + codigo)
                .located(By.cssSelector("input[type='checkbox'][value='" + codigo + "']"));
    }

    public static Target checkboxGarantiaPorLabel(String texto) {
        return Target.the("garantía " + texto)
                .locatedBy("//label[contains(.,'" + texto + "')]//input[@type='checkbox']");
    }
}
