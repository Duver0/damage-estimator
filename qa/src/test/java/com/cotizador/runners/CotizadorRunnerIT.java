package com.cotizador.runners;

import io.cucumber.junit.CucumberOptions;
import net.serenitybdd.cucumber.CucumberWithSerenity;
import org.junit.runner.RunWith;

@RunWith(CucumberWithSerenity.class)
@CucumberOptions(
    features = "classpath:features/cotizador",
    glue = "com.cotizador.features",
    plugin = {"pretty"}
)
public class CotizadorRunnerIT {}
