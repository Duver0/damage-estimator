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
                String text = el.getText().replaceAll("[^0-9,]", "").replace(",", ".");
                if (!text.isEmpty()) {
                    try {
                        return Double.parseDouble(text);
                    } catch (NumberFormatException ignored) {}
                }
            }
        } catch (Exception ignored) {}
        return 0.0;
    }
}
