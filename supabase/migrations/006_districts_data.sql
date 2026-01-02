-- ============================================
-- DISTRITOS ELECTORALES PERU 2026
-- 25 Departamentos + Lima Provincias + Callao + Extranjero
-- ============================================

-- Limpiar datos existentes si los hay
DELETE FROM districts;

-- Insertar todos los distritos electorales
-- La distribución de diputados es proporcional a la población (130 total)
INSERT INTO districts (name, slug, type, senators_count, deputies_count) VALUES
-- Departamentos principales (ordenados por número de diputados)
('Lima', 'lima', 'departamento', 1, 36),
('La Libertad', 'la-libertad', 'departamento', 1, 7),
('Piura', 'piura', 'departamento', 1, 7),
('Arequipa', 'arequipa', 'departamento', 1, 6),
('Cajamarca', 'cajamarca', 'departamento', 1, 6),
('Cusco', 'cusco', 'departamento', 1, 5),
('Junín', 'junin', 'departamento', 1, 5),
('Lambayeque', 'lambayeque', 'departamento', 1, 5),
('Puno', 'puno', 'departamento', 1, 5),
('Ancash', 'ancash', 'departamento', 1, 4),
('Loreto', 'loreto', 'departamento', 1, 4),
('Ica', 'ica', 'departamento', 1, 3),
('San Martín', 'san-martin', 'departamento', 1, 3),
('Huánuco', 'huanuco', 'departamento', 1, 3),
('Ayacucho', 'ayacucho', 'departamento', 1, 3),
('Ucayali', 'ucayali', 'departamento', 1, 2),
('Apurímac', 'apurimac', 'departamento', 1, 2),
('Huancavelica', 'huancavelica', 'departamento', 1, 2),
('Amazonas', 'amazonas', 'departamento', 1, 2),
('Tacna', 'tacna', 'departamento', 1, 2),
('Pasco', 'pasco', 'departamento', 1, 2),
('Tumbes', 'tumbes', 'departamento', 1, 1),
('Moquegua', 'moquegua', 'departamento', 1, 1),
('Madre de Dios', 'madre-de-dios', 'departamento', 1, 1),

-- Distritos especiales
('Lima Provincias', 'lima-provincias', 'lima_provincia', 1, 4),
('Callao', 'callao', 'callao', 1, 4),
('Peruanos en el Extranjero', 'extranjero', 'extranjero', 0, 2);

-- Verificar total de diputados = 130
-- SELECT SUM(deputies_count) FROM districts; -- Debe ser 130
