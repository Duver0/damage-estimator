package com.cotizador.screenplay.questions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;

import java.util.List;

public class ValorNumericoEnPantalla implements Question<Double> {

    private final String cssContiene;

    private ValorNumericoEnPantalla(String cssContiene) {
        this.cssContiene = cssContiene;
    }

    public static ValorNumericoEnPantalla enElementosConClase(String cssContiene) {
        return new ValorNumericoEnPantalla(cssContiene);
    }

    @Override
    public Double answeredBy(Actor actor) {
        try {
            var driver = BrowseTheWeb.as(actor).getDriver();
            List<org.openqa.selenium.WebElement> elements =
                    driver.findElements(org.openqa.selenium.By.cssSelector("[class*='" + cssContiene + "']"));

            for (var el : elements) {
                double val = extraerNumero(el.getText());
                if (val > 0) return val;
            }
        } catch (Exception ignored) {}
        return 0.0;
    }

    private double extraerNumero(String texto) {
        if (texto == null || texto.isBlank()) return 0.0;
        try {
            String limpio = texto.replaceAll("[^0-9.,]", "");
            if (limpio.isEmpty()) return 0.0;

            int lastDot = limpio.lastIndexOf('.');
            int lastComma = limpio.lastIndexOf(',');

            String normalizado;
            if (lastDot > lastComma) {
                normalizado = limpio.replace(",", "");
            } else if (lastComma > lastDot) {
                normalizado = limpio.replace(".", "").replace(",", ".");
            } else {
                normalizado = limpio.replace(",", "").replace(".", "");
            }

            if (normalizado.isEmpty() || normalizado.equals(".")) return 0.0;
            return Double.parseDouble(normalizado);
        } catch (NumberFormatException ignored) {}
        return 0.0;
    }
}
