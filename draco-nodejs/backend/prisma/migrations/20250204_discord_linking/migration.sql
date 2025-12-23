-- Create account-level Discord settings
CREATE TABLE accountdiscordsettings (
    id BIGSERIAL PRIMARY KEY,
    accountid BIGINT NOT NULL,
    guildid VARCHAR(32),
    guildname VARCHAR(100),
    botuserid VARCHAR(32),
    botusername VARCHAR(100),
    rolesyncenabled BOOLEAN NOT NULL DEFAULT false,
    bottokenencrypted TEXT,
    createdat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_accountdiscordsettings_accounts FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_accountdiscordsettings_accountid ON accountdiscordsettings(accountid);

-- Create Discord role mappings
CREATE TABLE accountdiscordrolemapping (
    id BIGSERIAL PRIMARY KEY,
    accountid BIGINT NOT NULL,
    discordroleid VARCHAR(32) NOT NULL,
    discordrolename VARCHAR(100) NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    createdat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_accountdiscordrolemapping_accounts FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_accountdiscordrolemapping_accountid ON accountdiscordrolemapping(accountid);

-- Create per-user Discord account links
CREATE TABLE userdiscordaccounts (
    id BIGSERIAL PRIMARY KEY,
    userid VARCHAR(128) NOT NULL,
    accountid BIGINT NOT NULL,
    discorduserid VARCHAR(32) NOT NULL,
    username VARCHAR(100),
    discriminator VARCHAR(8),
    avatarurl VARCHAR(255),
    accesstokenencrypted TEXT,
    refreshtokenencrypted TEXT,
    tokenexpiresat TIMESTAMPTZ(6),
    guildmember BOOLEAN NOT NULL DEFAULT false,
    lastsyncedat TIMESTAMPTZ(6),
    createdat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_userdiscordaccounts_aspnetusers FOREIGN KEY (userid) REFERENCES aspnetusers(id) ON DELETE CASCADE,
    CONSTRAINT fk_userdiscordaccounts_accounts FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_userdiscordaccounts_account_user ON userdiscordaccounts(accountid, userid);
CREATE UNIQUE INDEX uq_userdiscordaccounts_account_discord ON userdiscordaccounts(accountid, discorduserid);
CREATE INDEX idx_userdiscordaccounts_discorduser ON userdiscordaccounts(discorduserid);
