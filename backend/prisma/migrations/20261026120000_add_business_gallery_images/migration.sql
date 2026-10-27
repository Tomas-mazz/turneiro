-- Photos of the shop's work for the booking page ("Nuestros trabajos").
ALTER TABLE "Business" ADD COLUMN "galleryImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
