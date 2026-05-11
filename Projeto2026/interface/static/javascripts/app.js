function initPageFeatures() {
  // Seed activeDepartment now that data arrays are guaranteed to exist
  activeDepartment = (window.departments || [])[0]?.id || "";

  setupAnimeStyleScrollFeature();
  setupScrollRecoveryFeature();
  setupQuickGlassNavFeature();
  setupTeamSectionFeature();
  setupDepartmentsFeature();
  setupActivitiesFeature();
  setupSupportFeature();
  setupDocumentsFilterFeature();
  setupPresidentsShowcaseFeature();
  setupHistoryTimelineFeature();
  setupRevealFeature();
  setupAboutTiltedCardsFeature();
  setupLanyardPhysicsFeature();
  setupHeroTextIntroFeature();
  setupHeroParallaxFeature();
}

if (typeof loadAppData === "function") {
  // json-server mode: fetch data first, then boot
  loadAppData()
    .then(initPageFeatures)
    .catch((err) => {
      console.error("[AEEUM] API fetch failed — booting with whatever data is available", err);
      initPageFeatures(); // boot anyway so the page isn't dead
    });
} else {
  // hardcoded mode: data is already in global scope, boot immediately
  initPageFeatures();
}
