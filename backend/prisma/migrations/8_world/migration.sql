-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "widthInChunks" INTEGER NOT NULL,
    "depthInChunks" INTEGER NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL,
    "octaves" INTEGER NOT NULL,
    "persistence" DOUBLE PRECISION NOT NULL,
    "relief" DOUBLE PRECISION NOT NULL,
    "baseHeight" DOUBLE PRECISION NOT NULL,
    "variationRange" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "World_campusId_key" ON "World"("campusId");

-- CreateTable
CREATE TABLE "WorldBlock" (
    "worldId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    "block" INTEGER NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorldBlock_pkey"
        PRIMARY KEY ("worldId", "x", "y", "z")
);

-- CreateIndex
CREATE INDEX "WorldBlock_worldId_idx"
    ON "WorldBlock"("worldId");

-- CreateTable
CREATE TABLE "BlockLog" (
    "id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    "worldBlockWorldId" TEXT,
    "worldBlockX" INTEGER,
    "worldBlockY" INTEGER,
    "worldBlockZ" INTEGER,

    CONSTRAINT "BlockLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockLog_id_key"
    ON "BlockLog"("id");

-- Foreign Keys
ALTER TABLE "World"
ADD CONSTRAINT "World_campusId_fkey"
FOREIGN KEY ("campusId")
REFERENCES "Campus"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "WorldBlock"
ADD CONSTRAINT "WorldBlock_worldId_fkey"
FOREIGN KEY ("worldId")
REFERENCES "World"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "BlockLog"
ADD CONSTRAINT "BlockLog_worldBlock_fkey"
FOREIGN KEY (
    "worldBlockWorldId",
    "worldBlockX",
    "worldBlockY",
    "worldBlockZ"
)
REFERENCES "WorldBlock"(
    "worldId",
    "x",
    "y",
    "z"
)
ON DELETE SET NULL
ON UPDATE CASCADE;