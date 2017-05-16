/*
 * SonarQube
 * Copyright (C) 2009-2017 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
package it.sourceCode;

import com.sonar.orchestrator.Orchestrator;
import it.Category1Suite;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import static util.ItUtils.runProjectAnalysis;
import static util.selenium.Selenese.runSelenese;

public class HighlightingTest {

  @ClassRule
  public static Orchestrator orchestrator = Category1Suite.ORCHESTRATOR;

  @Before
  public void deleteData() {
    orchestrator.resetData();
  }

  @Test
  public void highlight_source_code_and_symbols_usage() throws Exception {
    runProjectAnalysis(orchestrator, "highlighting/xoo-sample-with-highlighting-v2");

    runSelenese(orchestrator,
      // SONAR-3893 & SONAR-4247
      "/sourceCode/HighlightingTest/syntax-highlighting.html",
      // SONAR-4249 & SONAR-4250
      "/sourceCode/HighlightingTest/symbol-usages-highlighting.html");
  }

  // Check that E/S index is updated when file content is unchanged but plugin generates different syntax/symbol highlighting
  @Test
  public void update_highlighting_even_when_code_unchanged() throws Exception {
    runProjectAnalysis(orchestrator, "highlighting/xoo-sample-with-highlighting-v1");

    runSelenese(orchestrator, "/sourceCode/HighlightingTest/syntax-highlighting-v1.html");

    runProjectAnalysis(orchestrator, "highlighting/xoo-sample-with-highlighting-v2");

    runSelenese(orchestrator,
      "/sourceCode/HighlightingTest/syntax-highlighting-v2.html",
      "/sourceCode/HighlightingTest/symbol-usages-highlighting.html");
  }
}
