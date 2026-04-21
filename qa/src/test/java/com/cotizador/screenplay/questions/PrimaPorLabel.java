package com.cotizador.screenplay.questions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;
import org.openqa.selenium.WebElement;

import java.util.List;

public class PrimaPorLabel implements Question<Double> {

    private final String labelTexto;

    private PrimaPorLabel(String labelTexto) {
        this.labelTexto = labelTexto;
    }

    public static PrimaPorLabel de(String labelTexto) {
        return new PrimaPorLabel(labelTexto);
    }

    @Override
    public Double answeredBy(Actor actor) {
        try {
            var driver = BrowseTheWeb.as(actor).getDriver();

            String xpath = "//*[contains(text(),'" + labelTexto + "')]/following-sibling::*[self::strong or self::span][1]";
            List<WebElement> candidates = driver.findElements(org.openqa.selenium.By.xpath(xpath));
            for (WebElement el : candidates) {
                double val = extraerNumero(el.getText());
                if (val > 0) return val;
            }

            String xpathParent = "//*[contains(text(),'" + labelTexto + "')]/parent::*//strong";
            List<WebElement> strongs = driver.findElements(org.openqa.selenium.By.xpath(xpathParent));
            for (WebElement el : strongs) {
                double val = extraerNumero(el.getText());
                if (val > 0) return val;
            }

            String xpathTerms = "//*[contains(@class,'resultLabel') and contains(text(),'" + labelTexto + "')]/following-sibling::*[contains(@class,'resultValue')]";
            List<WebElement> termValues = driver.findElements(org.openqa.selenium.By.xpath(xpathTerms));
            for (WebElement el : termValues) {
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
            if (limpio.contains(",")) {
                limpio = limpio.replace(".", "").replace(",", ".");
            } else {
                limpio = limpio.replace(".", "");
            }
            if (limpio.isEmpty() || limpio.equals(".")) return 0.0;
            return Double.parseDouble(limpio);
        } catch (NumberFormatException ignored) {}
        return 0.0;
    }
}
