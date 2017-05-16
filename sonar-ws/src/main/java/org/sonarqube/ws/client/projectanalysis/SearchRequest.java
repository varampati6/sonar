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
package org.sonarqube.ws.client.projectanalysis;

import javax.annotation.CheckForNull;
import javax.annotation.Nullable;

import static com.google.common.base.Preconditions.checkArgument;
import static java.util.Objects.requireNonNull;

public class SearchRequest {
  public static final int DEFAULT_PAGE_SIZE = 100;
  public static final int MAX_SIZE = 500;

  private final String project;
  private final EventCategory category;
  private final int page;
  private final int pageSize;

  private SearchRequest(Builder builder) {
    this.project = builder.project;
    this.category = builder.category;
    this.page = builder.page;
    this.pageSize = builder.pageSize;
  }

  public String getProject() {
    return project;
  }

  @CheckForNull
  public EventCategory getCategory() {
    return category;
  }

  public int getPage() {
    return page;
  }

  public int getPageSize() {
    return pageSize;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private String project;
    private EventCategory category;
    private int page = 1;
    private int pageSize = DEFAULT_PAGE_SIZE;

    private Builder() {
      // enforce static factory method
    }

    public Builder setProject(String project) {
      this.project = project;
      return this;
    }

    public Builder setCategory(@Nullable EventCategory category) {
      this.category = category;
      return this;
    }

    public Builder setPage(int page) {
      this.page = page;
      return this;
    }

    public Builder setPageSize(int pageSize) {
      this.pageSize = pageSize;
      return this;
    }

    public SearchRequest build() {
      requireNonNull(project, "Project is required");
      checkArgument(pageSize <= MAX_SIZE, "Page size must be lower than or equal to " + MAX_SIZE);
      return new SearchRequest(this);
    }
  }
}
