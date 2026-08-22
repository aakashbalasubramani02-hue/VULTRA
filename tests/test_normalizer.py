from src.normalizer import (
    normalize_string,
    normalize_product_name,
    canonicalize_product_name,
    normalize_vendor_name,
)


def test_whitespace_and_case():
    assert normalize_string('  A   Product ') == 'a product'
    assert normalize_string('CORE BANKING FRAMEWORK') == 'core banking framework'


def test_product_normalisation():
    assert normalize_product_name('  Core   Banking Framework ') == 'core banking framework'
    assert normalize_product_name('Core-Banking-Framework') == 'core banking framework'


def test_alias_resolution():
    assert normalize_product_name('waf') == 'web application firewall'
    assert normalize_product_name('cloud db') == 'cloud database engine'
    assert normalize_product_name('idp') == 'identity provider saas'
    assert normalize_product_name('router os') == 'enterprise router os'


def test_canonicalize_product_name():
    assert canonicalize_product_name('waf') == 'Web Application Firewall'
    assert canonicalize_product_name('idp') == 'Identity Provider SaaS'


def test_vendor_normalisation():
    assert normalize_vendor_name('  Apache Software Foundation ') == 'apache software foundation'
    assert normalize_vendor_name('cisco') == 'cisco systems'
