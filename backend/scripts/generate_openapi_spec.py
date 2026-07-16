import os
import sys
import json

# Ensure python can find the 'app' module by inserting the backend root into sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.main import app
except ImportError as e:
    print(f"Error importing app.main: {e}")
    sys.exit(1)

def generate_openapi():
    # FastAPI app.openapi() generates the schema dictionary in runtime
    openapi_schema = app.openapi()
    
    if not openapi_schema:
        print("Error: Generated OpenAPI schema is empty.")
        sys.exit(1)
        
    # Validation: Ensure it is a valid OpenAPI JSON dictionary
    if "paths" not in openapi_schema or "info" not in openapi_schema:
        print("Error: Generated OpenAPI schema is malformed (missing 'paths' or 'info').")
        sys.exit(1)
        
    # Resolve the destination file path (Docs/openapi_real.json at workspace root)
    docs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Docs"))
    os.makedirs(docs_dir, exist_ok=True)
    target_file = os.path.join(docs_dir, "openapi_real.json")
    
    # Save openapi spec
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
        
    print(f"OpenAPI spec successfully saved to {target_file}")
    
    # Print summary information
    paths = openapi_schema.get("paths", {})
    components = openapi_schema.get("components", {})
    schemas = components.get("schemas", {})
    
    print("\n--- OpenAPI Spec Summary ---")
    print(f"Total endpoints (paths): {len(paths)}")
    
    # Display main paths (grouped by the first resource path segment)
    print("\nMain paths:")
    segments = {}
    for path in paths.keys():
        parts = [p for p in path.split("/") if p]
        if parts:
            first_seg = "/" + parts[0]
            segments[first_seg] = segments.get(first_seg, 0) + 1
            
    for seg, count in sorted(segments.items()):
        print(f"  {seg}: {count} endpoint(s)")
        
    print(f"\nTotal schemas generated: {len(schemas)}")
    print("----------------------------")

if __name__ == "__main__":
    generate_openapi()
