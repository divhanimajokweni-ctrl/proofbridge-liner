# DNS Update Instructions for venturevisionubuntu.co.za

The production site is hosted on Vercel. Keep the apex domain and `www` host aligned to Vercel.

## Required Records

```txt
Type: A
Name: @
Value: 76.76.21.21
TTL: 300
```

```txt
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 300
```

```txt
Type: A
Name: api
Value: 76.76.21.21
TTL: 300
```

## Remove Stale GitHub Pages Records

Delete these from active DNS if present:

```txt
@ A 185.199.108.153
@ A 185.199.109.153
@ A 185.199.110.153
@ A 185.199.111.153
www CNAME divhanimajokweni-ctrl.github.io
```

## Certificate Alignment

Vercel can issue the certificate only after the Vercel project contains the domain and DNS resolves to Vercel. The expected production hosts are:

```txt
venturevisionubuntu.co.za
www.venturevisionubuntu.co.za
```

Do not create or use `venturevisualubuntu.co.za`.

## Verification

```powershell
Resolve-DnsName venturevisionubuntu.co.za
Resolve-DnsName www.venturevisionubuntu.co.za
curl.exe -I https://venturevisionubuntu.co.za
curl.exe -I https://www.venturevisionubuntu.co.za
curl.exe -i https://venturevisionubuntu.co.za/api/health
```

Expected:

```txt
venturevisionubuntu.co.za -> 76.76.21.21
www.venturevisionubuntu.co.za -> Vercel target or Vercel edge IP
HTTPS apex -> 200
HTTPS www -> 200
/api/health -> JSON health payload with receipt_algorithm: RS256
```
