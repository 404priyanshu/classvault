# Align Note Chunk Lifecycle with Note Availability

For the MVP, ClassVault excludes note chunks from study roadmap generation as soon as their source note becomes recently deleted or admin-hidden, while preserving chunks during the 30-day recovery window for recently deleted notes so restoration can recover roadmap eligibility quickly. Note chunks are purged when their source note is permanently deleted, trading storage during recovery for consistent roadmap privacy and predictable note lifecycle behavior.
