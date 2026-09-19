/** Kept separately so the column/value contract can be regression tested. */
export const GENERATION_INSERT_SQL = `
  INSERT INTO generations
    (id, user_id, task_id, provider_task_id, provider_status_endpoint, provider, generation_type, status, prompt, model, aspect_ratio,
     quality, azure_resolution, duration, kling_mode, sound, reference_image_urls,
     image_url, image_urls, video_url, error_msg, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(task_id) DO NOTHING
`;
