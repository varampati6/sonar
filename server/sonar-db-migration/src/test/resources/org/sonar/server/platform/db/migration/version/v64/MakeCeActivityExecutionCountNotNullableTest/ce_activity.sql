CREATE TABLE "CE_ACTIVITY" (
  "ID" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1, INCREMENT BY 1),
  "UUID" VARCHAR(40) NOT NULL,
  "TASK_TYPE" VARCHAR(15) NOT NULL,
  "COMPONENT_UUID" VARCHAR(40) NULL,
  "ANALYSIS_UUID" VARCHAR(50) NULL,
  "STATUS" VARCHAR(15) NOT NULL,
  "IS_LAST" BOOLEAN NOT NULL,
  "IS_LAST_KEY" VARCHAR(55) NOT NULL,
  "SUBMITTER_LOGIN" VARCHAR(255) NULL,
  "WORKER_UUID" VARCHAR(40) NULL,
  "EXECUTION_COUNT" INTEGER NULL,
  "SUBMITTED_AT" BIGINT NOT NULL,
  "STARTED_AT" BIGINT NULL,
  "EXECUTED_AT" BIGINT NULL,
  "CREATED_AT" BIGINT NOT NULL,
  "UPDATED_AT" BIGINT NOT NULL,
  "EXECUTION_TIME_MS" BIGINT NULL,
  "ERROR_MESSAGE" VARCHAR(1000),
  "ERROR_STACKTRACE" CLOB(2147483647)
);
CREATE UNIQUE INDEX "CE_ACTIVITY_UUID" ON "CE_ACTIVITY" ("UUID");
CREATE INDEX "CE_ACTIVITY_COMPONENT_UUID" ON "CE_ACTIVITY" ("COMPONENT_UUID");
CREATE INDEX "CE_ACTIVITY_ISLASTKEY" ON "CE_ACTIVITY" ("IS_LAST_KEY");
CREATE INDEX "CE_ACTIVITY_ISLAST_STATUS" ON "CE_ACTIVITY" ("IS_LAST", "STATUS");
