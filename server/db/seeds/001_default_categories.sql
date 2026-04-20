INSERT INTO categories (user_id, name, color_hex, is_default)
VALUES
  (NULL, 'Food', '#FF8A65', TRUE),
  (NULL, 'Transport', '#4DB6AC', TRUE),
  (NULL, 'Utilities', '#7986CB', TRUE),
  (NULL, 'Shopping', '#BA68C8', TRUE),
  (NULL, 'Health', '#81C784', TRUE),
  (NULL, 'Entertainment', '#FFD54F', TRUE)
ON CONFLICT (COALESCE(user_id, 0), lower(name))
DO NOTHING;
