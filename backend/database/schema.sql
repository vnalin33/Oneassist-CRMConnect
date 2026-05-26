-- Oneassist-CRMConnect Production Database Schema
-- Generated dynamically on 2026-05-26T05:00:35.463Z
-- Use this script to initialize the PostgreSQL database tables.


-- -----------------------------------------------------
-- Table Structure for `Connector`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS "Connector" (
  id                        SERIAL NOT NULL PRIMARY KEY,
  username                  CHARACTER VARYING(255) NOT NULL,
  password                  CHARACTER VARYING(255) NOT NULL,
  employeename              CHARACTER VARYING(255),
  email                     CHARACTER VARYING(255),
  proj                      CHARACTER VARYING(255),
  "createdDate"             TIMESTAMPTZ NOT NULL,
  "updatedDate"             TIMESTAMPTZ NOT NULL,
  phone                     CHARACTER VARYING(20)
);

-- -----------------------------------------------------
-- Table Structure for `connector`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS connector (
  id                        SERIAL NOT NULL PRIMARY KEY,
  name                      TEXT NOT NULL,
  mobilenumber              TEXT,
  emailid                   TEXT,
  password                  TEXT,
  isactive                  BOOLEAN NOT NULL DEFAULT true,
  location                  TEXT,
  createdtime               TIMESTAMPTZ,
  createdby                 INTEGER,
  "createdDate"             TIMESTAMPTZ NOT NULL,
  "updatedDate"             TIMESTAMPTZ NOT NULL,
  ifsc                      TEXT,
  accountnumber             TEXT,
  branch                    TEXT,
  followedby                INTEGER,
  reset_token               CHARACTER VARYING(255),
  reset_token_expiry        TIMESTAMP,
  profile_picture           CHARACTER VARYING(255),
  dob                       DATE,
  pan_number                VARCHAR(255),
  is_gst_registered         BOOLEAN DEFAULT false,
  gst_number                VARCHAR(255),
  address                   TEXT,
  profession                TEXT,
  bank_name                 CHARACTER VARYING(255),
  account_holder_name       CHARACTER VARYING(255)
);

-- -----------------------------------------------------
-- Table Structure for `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                        SERIAL NOT NULL PRIMARY KEY,
  name                      CHARACTER VARYING(100) NOT NULL,
  email                     CHARACTER VARYING(100) NOT NULL,
  mobile                    CHARACTER VARYING(15) NOT NULL,
  password                  CHARACTER VARYING(255) NOT NULL,
  role                      CHARACTER VARYING(50) DEFAULT 'Finance Agent'::character varying,
  rating                    NUMERIC DEFAULT 0.0,
  is_top_performer          BOOLEAN DEFAULT false,
  created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_token               CHARACTER VARYING(255),
  token_expiry              TIMESTAMP,
  reset_token_expiry        TIMESTAMP
);

-- -----------------------------------------------------
-- Table Structure for `employeedetails`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS employeedetails (
  id                        SERIAL NOT NULL PRIMARY KEY,
  name                      CHARACTER VARYING(200),
  qualification             CHARACTER VARYING(300),
  dateofbirth               TIMESTAMPTZ,
  joindate                  TIMESTAMPTZ,
  presentaddress            TEXT,
  permanentaddress          TEXT,
  emailid                   TEXT,
  designation               TEXT,
  mobilenumber              CHARACTER VARYING(150),
  contactperson             CHARACTER VARYING(150),
  contactnumber             CHARACTER VARYING(150),
  logintime                 TIMESTAMPTZ,
  oldpassword               TEXT,
  password                  TEXT,
  resetpasswordexpiry       TIMESTAMPTZ,
  resetpasswordkey          TEXT,
  isactive                  BOOLEAN NOT NULL,
  isadminrights             BOOLEAN NOT NULL,
  isleadrights              BOOLEAN NOT NULL,
  iscontactrights           BOOLEAN NOT NULL,
  iscibilrights             BOOLEAN NOT NULL,
  isicicirights             BOOLEAN NOT NULL,
  organizationid            INTEGER,
  dept                      CHARACTER VARYING(120),
  issplrights               BOOLEAN,
  isreassignrights          BOOLEAN,
  image_data                BYTEA
);

-- -----------------------------------------------------
-- Table Structure for `leadpersonaldetails`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS leadpersonaldetails (
  id                        SERIAL NOT NULL PRIMARY KEY,
  firstname                 CHARACTER VARYING(200),
  lastname                  CHARACTER VARYING(200),
  mobilenumber              CHARACTER VARYING(150),
  locationid                INTEGER,
  email                     CHARACTER VARYING(150),
  dateofbirth               TIMESTAMPTZ,
  pannumber                 CHARACTER VARYING(150),
  aadharnumber              CHARACTER VARYING(150),
  presentaddress            TEXT,
  pincode                   CHARACTER VARYING(150),
  permanentaddress          TEXT,
  gender                    CHARACTER VARYING(150),
  materialstatus            CHARACTER VARYING(150),
  noofdependent             INTEGER,
  educationalqualification  TEXT,
  type                      TEXT,
  status                    INTEGER,
  referencename             CHARACTER VARYING(200),
  organizationid            INTEGER,
  createdon                 TIMESTAMPTZ,
  connectorid               INTEGER,
  createdby                 CHARACTER VARYING(150),
  productname               CHARACTER VARYING(150),
  remarks                   CHARACTER VARYING(250),
  connectorcontactid        INTEGER,
  extcustomerid             INTEGER,
  contacttype               CHARACTER VARYING(120),
  whatsappnumber            CHARACTER VARYING(150),
  loantype                  CHARACTER VARYING(100),
  loanamount                CHARACTER VARYING(50),
  annualincome              CHARACTER VARYING(50),
  employmenttype            CHARACTER VARYING(100),
  notes                     TEXT,
  servicetype               CHARACTER VARYING(100),
  processingtype            CHARACTER VARYING(100),
  cibilscore                INTEGER,
  profession                CHARACTER VARYING(255),
  existingloans             INTEGER,
  companytype               TEXT,
  sectortype                TEXT,
  company_type              CHARACTER VARYING(255),
  sector_type               CHARACTER VARYING(255)
);

-- -----------------------------------------------------
-- Table Structure for `invoice_requests`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_requests (
  id                        SERIAL NOT NULL PRIMARY KEY,
  connectorid               INTEGER,
  connector_name            CHARACTER VARYING(255),
  contact_name              CHARACTER VARYING(255),
  mobile_number             CHARACTER VARYING(20),
  loan_type                 CHARACTER VARYING(100),
  loan_amount               NUMERIC DEFAULT 0,
  disbursed_amount          NUMERIC DEFAULT 0,
  payout_percent            NUMERIC DEFAULT 0,
  payout_amount             NUMERIC DEFAULT 0,
  sgst                      NUMERIC DEFAULT 0,
  cgst                      NUMERIC DEFAULT 0,
  total_amount              NUMERIC DEFAULT 0,
  invoice_type              CHARACTER VARYING(20) DEFAULT 'instant'::character varying,
  bank_name                 CHARACTER VARYING(100),
  track_number              CHARACTER VARYING(50),
  status                    CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  admin_remarks             TEXT,
  created_at                TIMESTAMP DEFAULT now(),
  updated_at                TIMESTAMP DEFAULT now(),
  expected_payout_date      TIMESTAMP,
  tds                       NUMERIC DEFAULT 0,
  track_id                  INTEGER,
  service_type              CHARACTER VARYING(100),
  processing_type           CHARACTER VARYING(50),
  is_gst_registered         BOOLEAN DEFAULT false,
  remarks                   TEXT,
  invoice_number            CHARACTER VARYING(50),
  billing_from_name         CHARACTER VARYING(255),
  billing_from_address      TEXT,
  billing_from_phone        CHARACTER VARYING(20),
  billing_from_email        CHARACTER VARYING(100),
  billing_from_pan          CHARACTER VARYING(20),
  billing_from_gstin        CHARACTER VARYING(30),
  billing_to_name           CHARACTER VARYING(255),
  billing_to_address        TEXT,
  billing_to_phone          CHARACTER VARYING(20),
  billing_to_email          CHARACTER VARYING(100),
  billing_to_pan            CHARACTER VARYING(20),
  billing_to_gst            CHARACTER VARYING(30),
  place_of_supply           CHARACTER VARYING(100)
);

-- -----------------------------------------------------
-- Table Structure for `withdrawals`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
  id                        SERIAL NOT NULL PRIMARY KEY,
  connector_id              INTEGER NOT NULL,
  connector_name            CHARACTER VARYING(255) DEFAULT ''::character varying,
  amount                    NUMERIC NOT NULL DEFAULT 0,
  status                    CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
  bank_details              JSONB DEFAULT '{}'::jsonb,
  remarks                   TEXT DEFAULT ''::text,
  request_date              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_date             TIMESTAMP,
  paid_date                 TIMESTAMP
);

-- -----------------------------------------------------
-- Table Structure for `notifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id                        SERIAL NOT NULL PRIMARY KEY,
  connectorid               INTEGER NOT NULL,
  title                     CHARACTER VARYING(255) NOT NULL,
  body                      TEXT NOT NULL,
  type                      CHARACTER VARYING(50) NOT NULL,
  read_status               BOOLEAN DEFAULT false,
  created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata                  JSONB DEFAULT '{}'::jsonb
);

-- -----------------------------------------------------
-- Table Structure for `password_reset_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id                        SERIAL NOT NULL PRIMARY KEY,
  email                     CHARACTER VARYING(255) NOT NULL,
  token_hash                CHARACTER VARYING(255) NOT NULL,
  expires_at                TIMESTAMP NOT NULL,
  used                      BOOLEAN DEFAULT false,
  created_at                TIMESTAMP DEFAULT now()
);

-- -----------------------------------------------------
-- Table Structure for `company_profile`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS company_profile (
  id                        INTEGER NOT NULL DEFAULT 1,
  company_name              CHARACTER VARYING(255) DEFAULT ''::character varying,
  address                   TEXT DEFAULT ''::text,
  phone                     CHARACTER VARYING(50) DEFAULT ''::character varying,
  email                     CHARACTER VARYING(255) DEFAULT ''::character varying,
  pan                       CHARACTER VARYING(20) DEFAULT ''::character varying,
  gstin                     CHARACTER VARYING(20) DEFAULT ''::character varying,
  place_of_supply           CHARACTER VARYING(100) DEFAULT ''::character varying,
  logo_base64               TEXT DEFAULT ''::text,
  updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- -----------------------------------------------------
-- Table Structure for `leadtrackdetails`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS leadtrackdetails (
  id                        SERIAL NOT NULL PRIMARY KEY,
  leadid                    INTEGER,
  appoinmentdate            TIMESTAMPTZ,
  status                    INTEGER,
  notes                     TEXT,
  isdirectmeet              BOOLEAN,
  occupationtype            TEXT,
  loantype                  TEXT,
  desireloanamount          NUMERIC,
  tenure                    INTEGER,
  preferedbank              TEXT,
  cibilscore                INTEGER,
  incometype                TEXT,
  incomeamount              NUMERIC,
  isidproof                 BOOLEAN,
  isageproof                BOOLEAN,
  isaddessproof             BOOLEAN,
  iscreditcardstatement     BOOLEAN,
  isexistingloantrack       BOOLEAN,
  iscurrentaccountstatement BOOLEAN,
  isstabilityproof          BOOLEAN,
  isbankstatement           BOOLEAN,
  ispayslip                 BOOLEAN,
  isform16                  BOOLEAN,
  isbusinessproof           BOOLEAN,
  isitr                     BOOLEAN,
  isgststatement            BOOLEAN,
  isencumbrancecertificate  BOOLEAN,
  istitledeed               BOOLEAN,
  isparentdeed              BOOLEAN,
  islayoutplan              BOOLEAN,
  isregulationorder         BOOLEAN,
  isbuildingpermit          BOOLEAN,
  ispropertytax             BOOLEAN,
  ispatta                   BOOLEAN,
  isconstructionagreement   BOOLEAN,
  issaleagreement           BOOLEAN,
  isapf                     BOOLEAN,
  isudsregistration         BOOLEAN,
  isrcbook                  BOOLEAN,
  bankname                  TEXT,
  applicationnumber         TEXT,
  logindate                 TIMESTAMPTZ,
  loginvalue                NUMERIC,
  sanctionroi               NUMERIC,
  sanctiontenure            INTEGER,
  sanctionletter            TEXT,
  sanctionvalue             NUMERIC,
  sanctiondate              TIMESTAMPTZ,
  psdcondition              TEXT,
  islegal                   BOOLEAN,
  istechnical               BOOLEAN,
  legalreport               TEXT,
  technicalreport           TEXT,
  ispsdconditionverified    BOOLEAN,
  modifyon                  TIMESTAMPTZ,
  contactfollowedby         INTEGER,
  leadfollowedby            INTEGER,
  isnoresponse              BOOLEAN,
  organizationid            INTEGER,
  payoutpercent             NUMERIC,
  ispaid                    BOOLEAN,
  connectorcontactid        INTEGER,
  disbursementamount        NUMERIC,
  customername              CHARACTER VARYING(150),
  datastrength              CHARACTER VARYING(220),
  compname                  CHARACTER VARYING(200),
  compcat                   CHARACTER VARYING(101),
  custsegment               CHARACTER VARYING(120),
  tracknumber               TEXT,
  customer                  BOOLEAN,
  preferredroi              NUMERIC,
  totalactiveloans          INTEGER,
  riskcategory              VARCHAR(255)
);
