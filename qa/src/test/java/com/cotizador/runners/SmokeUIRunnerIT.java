package com.cotizador.runners;

import io.cucumber.junit.CucumberOptions;
import net.serenitybdd.cucumber.CucumberWithSerenity;
import org.junit.runner.RunWith;

@RunWith(CucumberWithSerenity.class)
@CucumberOptions(
    features = "classpath:features",
    glue = "com.cotizador.features",
    tags = "@smoke",
    plugin = {"pretty"}
)
public class SmokeUIRunnerIT {}
