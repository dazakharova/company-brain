"""Smoke tests against the running backend; only Python's standard library is needed."""

import json
import os
import unittest
from urllib.request import urlopen

BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")


class BackendSmokeTests(unittest.TestCase):
    def test_health(self):
        with urlopen(f"{BASE_URL}/health", timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get_content_type(), "application/json")
            self.assertEqual(json.load(response), {"status": "ok"})

    def test_database_connectivity(self):
        with urlopen(f"{BASE_URL}/health/db", timeout=10) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get_content_type(), "application/json")
            self.assertEqual(json.load(response), {"status": "ok", "database": "ok"})

    def test_swagger_documentation(self):
        with urlopen(f"{BASE_URL}/docs", timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get_content_type(), "text/html")
            page = response.read().decode()
            self.assertIn("swagger-ui", page)
            self.assertIn("/openapi.json", page)

    def test_openapi_schema(self):
        with urlopen(f"{BASE_URL}/openapi.json", timeout=5) as response:
            self.assertEqual(response.status, 200)
            schema = json.load(response)
            self.assertEqual(schema["info"]["title"], "Company Brain API")
            self.assertIn("200", schema["paths"]["/health"]["get"]["responses"])
            database_responses = schema["paths"]["/health/db"]["get"]["responses"]
            self.assertIn("200", database_responses)
            self.assertIn("503", database_responses)


if __name__ == "__main__":
    unittest.main()
