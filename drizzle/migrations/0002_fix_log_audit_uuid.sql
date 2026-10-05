CREATE OR REPLACE FUNCTION public.log_audit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE rec jsonb; _sid uuid;
BEGIN
  rec := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  BEGIN _sid := NULLIF(rec->>'school_id','')::uuid; EXCEPTION WHEN others THEN _sid := NULL; END;
  INSERT INTO public.audit_logs(user_id, action, entity_type, entity_id, details, school_id)
  VALUES (auth.uid(), TG_TABLE_NAME || '.' || lower(TG_OP), TG_TABLE_NAME, NULLIF(rec->>'id','')::uuid,
          jsonb_build_object('op', TG_OP), COALESCE(_sid, public.current_school_id()));
  RETURN NULL;
END $function$;