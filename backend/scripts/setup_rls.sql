-- ============================================================================
-- RNF-SEG-002: Aislamiento Multitenant con Row Level Security (RLS) en PostgreSQL
-- ============================================================================

-- 1. Habilitar RLS en la tabla FormatoUnico
ALTER TABLE formato_unico ENABLE ROW LEVEL SECURITY;

-- 2. Política de aislamiento: Un CUSTOMER solo puede ver/modificar SUS PROPIOS registros
-- Excepción: Un rol de ADMIN podría hacer un bypass (ej. BYPASSRLS) o tener otra política
CREATE POLICY user_isolation_policy ON formato_unico
    FOR ALL
    TO authenticated
    USING (
        customer_id::text = current_setting('app.current_user_id', true)
        -- Si hubiera roles podríamos hacer algo como:
        -- OR current_setting('app.user_role', true) = 'ADMIN'
    )
    WITH CHECK (
        customer_id::text = current_setting('app.current_user_id', true)
    );

-- Notas de uso:
-- En el middleware de base de datos de FastAPI (o SQLAlchemy session),
-- se debe ejecutar esto justo antes de la transacción:
-- SET LOCAL app.current_user_id = 'user-uuid-extraido-del-jwt';
