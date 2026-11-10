--
-- PostgreSQL database dump
--

\restrict qaK7QuA2kHPFRIopZVrWvllkuky9DZT0yucIPwLiWqCOvsMHyrhVmoqhI9ZwkNA

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CodActiune; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CodActiune" AS ENUM (
    'CALCUL',
    'RECALCUL',
    'NOTIFICARI',
    'EXPORT_PDF',
    'RAPORT'
);


ALTER TYPE public."CodActiune" OWNER TO postgres;

--
-- Name: MetodaPlata; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MetodaPlata" AS ENUM (
    'CASIERIE',
    'TRANSFER',
    'CARD'
);


ALTER TYPE public."MetodaPlata" OWNER TO postgres;

--
-- Name: ModRepartizare; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ModRepartizare" AS ENUM (
    'COTA_PARTE',
    'PERSOANE',
    'CONSUM',
    'APARTAMENT',
    'SUPRAFATA'
);


ALTER TYPE public."ModRepartizare" OWNER TO postgres;

--
-- Name: Rol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Rol" AS ENUM (
    'ADMIN',
    'PRESEDINTE',
    'PROPRIETAR'
);


ALTER TYPE public."Rol" OWNER TO postgres;

--
-- Name: StatusAbonament; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusAbonament" AS ENUM (
    'ACTIV',
    'SUSPENDAT',
    'ANULAT',
    'EXPIRAT'
);


ALTER TYPE public."StatusAbonament" OWNER TO postgres;

--
-- Name: StatusComanda; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusComanda" AS ENUM (
    'IN_ASTEPTARE',
    'ACHITATA',
    'ANULATA'
);


ALTER TYPE public."StatusComanda" OWNER TO postgres;

--
-- Name: StatusFisa; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusFisa" AS ENUM (
    'NEPLATITA',
    'PARTIAL_PLATITA',
    'PLATITA'
);


ALTER TYPE public."StatusFisa" OWNER TO postgres;

--
-- Name: StatusLuna; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusLuna" AS ENUM (
    'DESCHISA',
    'CALCULATA',
    'APROBATA',
    'PUBLICATA',
    'INCHISA'
);


ALTER TYPE public."StatusLuna" OWNER TO postgres;

--
-- Name: StatusPlata; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusPlata" AS ENUM (
    'INREGISTRATA',
    'ANULATA'
);


ALTER TYPE public."StatusPlata" OWNER TO postgres;

--
-- Name: StatusSesizare; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusSesizare" AS ENUM (
    'NOUA',
    'IN_LUCRU',
    'REZOLVATA'
);


ALTER TYPE public."StatusSesizare" OWNER TO postgres;

--
-- Name: SursaCitire; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SursaCitire" AS ENUM (
    'PROPRIETAR',
    'ADMIN',
    'ESTIMAT'
);


ALTER TYPE public."SursaCitire" OWNER TO postgres;

--
-- Name: TipComanda; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipComanda" AS ENUM (
    'ABONAMENT',
    'PACHET'
);


ALTER TYPE public."TipComanda" OWNER TO postgres;

--
-- Name: TipFond; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipFond" AS ENUM (
    'RULMENT',
    'REPARATII'
);


ALTER TYPE public."TipFond" OWNER TO postgres;

--
-- Name: TipNotificare; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipNotificare" AS ENUM (
    'INTRETINERE',
    'PLATA',
    'SESIZARE',
    'ABONAMENT',
    'TOKENI',
    'SISTEM'
);


ALTER TYPE public."TipNotificare" OWNER TO postgres;

--
-- Name: TipTranzactie; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipTranzactie" AS ENUM (
    'ALOCARE',
    'CONSUM',
    'CUMPARARE',
    'EXPIRARE',
    'BONUS'
);


ALTER TYPE public."TipTranzactie" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: abonamente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.abonamente (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    plan_id integer NOT NULL,
    plan_urmator_id integer,
    inceput_perioada timestamp(3) without time zone NOT NULL,
    sfarsit_perioada timestamp(3) without time zone NOT NULL,
    status public."StatusAbonament" DEFAULT 'ACTIV'::public."StatusAbonament" NOT NULL,
    reinnoire_automata boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.abonamente OWNER TO postgres;

--
-- Name: abonamente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.abonamente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.abonamente_id_seq OWNER TO postgres;

--
-- Name: abonamente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.abonamente_id_seq OWNED BY public.abonamente.id;


--
-- Name: actiuni_taxabile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actiuni_taxabile (
    id integer NOT NULL,
    cod public."CodActiune" NOT NULL,
    denumire text NOT NULL,
    cost_tokeni integer NOT NULL
);


ALTER TABLE public.actiuni_taxabile OWNER TO postgres;

--
-- Name: actiuni_taxabile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actiuni_taxabile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actiuni_taxabile_id_seq OWNER TO postgres;

--
-- Name: actiuni_taxabile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actiuni_taxabile_id_seq OWNED BY public.actiuni_taxabile.id;


--
-- Name: alocari_plati; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alocari_plati (
    id integer NOT NULL,
    plata_id integer NOT NULL,
    fisa_id integer NOT NULL,
    suma numeric(12,2) NOT NULL
);


ALTER TABLE public.alocari_plati OWNER TO postgres;

--
-- Name: alocari_plati_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alocari_plati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alocari_plati_id_seq OWNER TO postgres;

--
-- Name: alocari_plati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alocari_plati_id_seq OWNED BY public.alocari_plati.id;


--
-- Name: anunturi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anunturi (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    autor_id integer NOT NULL,
    titlu text NOT NULL,
    continut text NOT NULL,
    important boolean DEFAULT false NOT NULL,
    data_publicare timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.anunturi OWNER TO postgres;

--
-- Name: anunturi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anunturi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anunturi_id_seq OWNER TO postgres;

--
-- Name: anunturi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anunturi_id_seq OWNED BY public.anunturi.id;


--
-- Name: apartamente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.apartamente (
    id integer NOT NULL,
    scara_id integer NOT NULL,
    numar text NOT NULL,
    etaj integer NOT NULL,
    suprafata_utila numeric(8,2) NOT NULL,
    cota_parte numeric(7,4) NOT NULL,
    nr_persoane integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.apartamente OWNER TO postgres;

--
-- Name: apartamente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.apartamente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.apartamente_id_seq OWNER TO postgres;

--
-- Name: apartamente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.apartamente_id_seq OWNED BY public.apartamente.id;


--
-- Name: asociatii; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asociatii (
    id integer NOT NULL,
    denumire text NOT NULL,
    cui text NOT NULL,
    adresa text NOT NULL,
    iban text NOT NULL,
    banca text,
    zi_limita_citiri integer DEFAULT 20 NOT NULL,
    zile_scadenta integer DEFAULT 20 NOT NULL,
    procent_penalizare_zi numeric(5,3) DEFAULT 0.2 NOT NULL,
    zile_gratie_penalizare integer DEFAULT 30 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.asociatii OWNER TO postgres;

--
-- Name: asociatii_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asociatii_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asociatii_id_seq OWNER TO postgres;

--
-- Name: asociatii_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asociatii_id_seq OWNED BY public.asociatii.id;


--
-- Name: blocuri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocuri (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    denumire text NOT NULL,
    adresa text NOT NULL
);


ALTER TABLE public.blocuri OWNER TO postgres;

--
-- Name: blocuri_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocuri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocuri_id_seq OWNER TO postgres;

--
-- Name: blocuri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocuri_id_seq OWNED BY public.blocuri.id;


--
-- Name: categorii_cheltuieli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorii_cheltuieli (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    denumire text NOT NULL,
    mod_repartizare public."ModRepartizare" NOT NULL,
    activa boolean DEFAULT true NOT NULL
);


ALTER TABLE public.categorii_cheltuieli OWNER TO postgres;

--
-- Name: categorii_cheltuieli_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorii_cheltuieli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorii_cheltuieli_id_seq OWNER TO postgres;

--
-- Name: categorii_cheltuieli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorii_cheltuieli_id_seq OWNED BY public.categorii_cheltuieli.id;


--
-- Name: citiri_contoare; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citiri_contoare (
    id integer NOT NULL,
    contor_id integer NOT NULL,
    luna_id integer NOT NULL,
    introdus_de_id integer,
    index numeric(12,3) NOT NULL,
    consum numeric(12,3) NOT NULL,
    data_citire timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sursa public."SursaCitire" DEFAULT 'PROPRIETAR'::public."SursaCitire" NOT NULL,
    validata boolean DEFAULT false NOT NULL
);


ALTER TABLE public.citiri_contoare OWNER TO postgres;

--
-- Name: citiri_contoare_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.citiri_contoare_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.citiri_contoare_id_seq OWNER TO postgres;

--
-- Name: citiri_contoare_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.citiri_contoare_id_seq OWNED BY public.citiri_contoare.id;


--
-- Name: comenzi_simulate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comenzi_simulate (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    utilizator_id integer,
    abonament_id integer,
    tip public."TipComanda" NOT NULL,
    plan_id integer,
    pachet_id integer,
    suma numeric(10,2) NOT NULL,
    status public."StatusComanda" DEFAULT 'IN_ASTEPTARE'::public."StatusComanda" NOT NULL,
    referinta text NOT NULL,
    achitata_la timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comenzi_simulate OWNER TO postgres;

--
-- Name: comenzi_simulate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comenzi_simulate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comenzi_simulate_id_seq OWNER TO postgres;

--
-- Name: comenzi_simulate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comenzi_simulate_id_seq OWNED BY public.comenzi_simulate.id;


--
-- Name: contoare; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contoare (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    serie text NOT NULL,
    data_verificare_metrologica date,
    activ boolean DEFAULT true NOT NULL
);


ALTER TABLE public.contoare OWNER TO postgres;

--
-- Name: contoare_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contoare_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contoare_id_seq OWNER TO postgres;

--
-- Name: contoare_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contoare_id_seq OWNED BY public.contoare.id;


--
-- Name: cupoane_reducere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cupoane_reducere (
    id integer NOT NULL,
    cod character varying(30) NOT NULL,
    procent_reducere numeric(5,2) NOT NULL,
    plan_id integer,
    valabil_pana date NOT NULL,
    utilizari_maxime integer DEFAULT 1 NOT NULL,
    utilizari integer DEFAULT 0 NOT NULL,
    activ boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cupoane_reducere OWNER TO postgres;

--
-- Name: cupoane_reducere_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cupoane_reducere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cupoane_reducere_id_seq OWNER TO postgres;

--
-- Name: cupoane_reducere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cupoane_reducere_id_seq OWNED BY public.cupoane_reducere.id;


--
-- Name: detalii_intretinere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalii_intretinere (
    id integer NOT NULL,
    fisa_id integer NOT NULL,
    categorie_id integer NOT NULL,
    baza_calcul numeric(12,4) NOT NULL,
    suma numeric(12,2) NOT NULL
);


ALTER TABLE public.detalii_intretinere OWNER TO postgres;

--
-- Name: detalii_intretinere_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalii_intretinere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalii_intretinere_id_seq OWNER TO postgres;

--
-- Name: detalii_intretinere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalii_intretinere_id_seq OWNED BY public.detalii_intretinere.id;


--
-- Name: facturi_furnizori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facturi_furnizori (
    id integer NOT NULL,
    furnizor_id integer NOT NULL,
    luna_id integer NOT NULL,
    categorie_id integer NOT NULL,
    numar text NOT NULL,
    data_emitere date NOT NULL,
    data_scadenta date NOT NULL,
    suma numeric(12,2) NOT NULL,
    cantitate numeric(12,3),
    platita boolean DEFAULT false NOT NULL,
    fisier_url text
);


ALTER TABLE public.facturi_furnizori OWNER TO postgres;

--
-- Name: facturi_furnizori_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facturi_furnizori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.facturi_furnizori_id_seq OWNER TO postgres;

--
-- Name: facturi_furnizori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facturi_furnizori_id_seq OWNED BY public.facturi_furnizori.id;


--
-- Name: facturi_simulate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facturi_simulate (
    id integer NOT NULL,
    comanda_id integer NOT NULL,
    numar character varying(20) NOT NULL,
    data_emitere date NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tva numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.facturi_simulate OWNER TO postgres;

--
-- Name: facturi_simulate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facturi_simulate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.facturi_simulate_id_seq OWNER TO postgres;

--
-- Name: facturi_simulate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facturi_simulate_id_seq OWNED BY public.facturi_simulate.id;


--
-- Name: fise_intretinere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fise_intretinere (
    id integer NOT NULL,
    luna_id integer NOT NULL,
    apartament_id integer NOT NULL,
    total_luna_curenta numeric(12,2) NOT NULL,
    restanta_anterioara numeric(12,2) DEFAULT 0 NOT NULL,
    penalizari numeric(12,2) DEFAULT 0 NOT NULL,
    total_de_plata numeric(12,2) NOT NULL,
    achitat numeric(12,2) DEFAULT 0 NOT NULL,
    status public."StatusFisa" DEFAULT 'NEPLATITA'::public."StatusFisa" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fise_intretinere OWNER TO postgres;

--
-- Name: fise_intretinere_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fise_intretinere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fise_intretinere_id_seq OWNER TO postgres;

--
-- Name: fise_intretinere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fise_intretinere_id_seq OWNED BY public.fise_intretinere.id;


--
-- Name: fonduri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fonduri (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    tip public."TipFond" NOT NULL,
    sold numeric(12,2) DEFAULT 0 NOT NULL,
    contributie_lunara numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.fonduri OWNER TO postgres;

--
-- Name: fonduri_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fonduri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fonduri_id_seq OWNER TO postgres;

--
-- Name: fonduri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fonduri_id_seq OWNED BY public.fonduri.id;


--
-- Name: furnizori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.furnizori (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    denumire text NOT NULL,
    cui text NOT NULL,
    iban text
);


ALTER TABLE public.furnizori OWNER TO postgres;

--
-- Name: furnizori_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.furnizori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.furnizori_id_seq OWNER TO postgres;

--
-- Name: furnizori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.furnizori_id_seq OWNED BY public.furnizori.id;


--
-- Name: luni_intretinere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.luni_intretinere (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    an integer NOT NULL,
    luna integer NOT NULL,
    status public."StatusLuna" DEFAULT 'DESCHISA'::public."StatusLuna" NOT NULL,
    data_limita_citiri date NOT NULL,
    data_publicare timestamp(3) without time zone,
    data_scadenta date,
    aprobat_de_id integer
);


ALTER TABLE public.luni_intretinere OWNER TO postgres;

--
-- Name: luni_intretinere_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.luni_intretinere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.luni_intretinere_id_seq OWNER TO postgres;

--
-- Name: luni_intretinere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.luni_intretinere_id_seq OWNED BY public.luni_intretinere.id;


--
-- Name: notificari; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificari (
    id integer NOT NULL,
    utilizator_id integer NOT NULL,
    tip public."TipNotificare" NOT NULL,
    mesaj text NOT NULL,
    citita boolean DEFAULT false NOT NULL,
    data_creare timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notificari OWNER TO postgres;

--
-- Name: notificari_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificari_id_seq OWNER TO postgres;

--
-- Name: notificari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificari_id_seq OWNED BY public.notificari.id;


--
-- Name: pachete_tokeni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pachete_tokeni (
    id integer NOT NULL,
    denumire text NOT NULL,
    tokeni integer NOT NULL,
    pret numeric(10,2) NOT NULL,
    activ boolean DEFAULT true NOT NULL
);


ALTER TABLE public.pachete_tokeni OWNER TO postgres;

--
-- Name: pachete_tokeni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pachete_tokeni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pachete_tokeni_id_seq OWNER TO postgres;

--
-- Name: pachete_tokeni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pachete_tokeni_id_seq OWNED BY public.pachete_tokeni.id;


--
-- Name: penalizari; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalizari (
    id integer NOT NULL,
    fisa_id integer NOT NULL,
    data_calcul date NOT NULL,
    zile_intarziere integer NOT NULL,
    suma numeric(10,2) NOT NULL
);


ALTER TABLE public.penalizari OWNER TO postgres;

--
-- Name: penalizari_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penalizari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penalizari_id_seq OWNER TO postgres;

--
-- Name: penalizari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penalizari_id_seq OWNED BY public.penalizari.id;


--
-- Name: planuri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planuri (
    id integer NOT NULL,
    cod text NOT NULL,
    denumire text NOT NULL,
    pret_lunar numeric(10,2) NOT NULL,
    tokeni_lunari integer NOT NULL,
    max_apartamente integer,
    max_blocuri integer,
    raport_anual boolean DEFAULT false NOT NULL,
    activ boolean DEFAULT true NOT NULL,
    descriere character varying(200),
    pret_anual numeric(10,2),
    recomandat boolean DEFAULT false NOT NULL
);


ALTER TABLE public.planuri OWNER TO postgres;

--
-- Name: planuri_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planuri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planuri_id_seq OWNER TO postgres;

--
-- Name: planuri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planuri_id_seq OWNED BY public.planuri.id;


--
-- Name: plati; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plati (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    platitor_id integer,
    inregistrat_de_id integer,
    suma numeric(12,2) NOT NULL,
    data_plata timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metoda public."MetodaPlata" NOT NULL,
    numar_chitanta text NOT NULL,
    status public."StatusPlata" DEFAULT 'INREGISTRATA'::public."StatusPlata" NOT NULL
);


ALTER TABLE public.plati OWNER TO postgres;

--
-- Name: plati_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plati_id_seq OWNER TO postgres;

--
-- Name: plati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plati_id_seq OWNED BY public.plati.id;


--
-- Name: portofele_tokeni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portofele_tokeni (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    tokeni_plan integer DEFAULT 0 NOT NULL,
    tokeni_extra integer DEFAULT 0 NOT NULL,
    ultima_resetare timestamp(3) without time zone,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.portofele_tokeni OWNER TO postgres;

--
-- Name: portofele_tokeni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.portofele_tokeni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portofele_tokeni_id_seq OWNER TO postgres;

--
-- Name: portofele_tokeni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.portofele_tokeni_id_seq OWNED BY public.portofele_tokeni.id;


--
-- Name: proprietati; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proprietati (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    utilizator_id integer NOT NULL,
    procent_detinere numeric(5,2) DEFAULT 100 NOT NULL,
    data_inceput date NOT NULL,
    data_sfarsit date
);


ALTER TABLE public.proprietati OWNER TO postgres;

--
-- Name: proprietati_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proprietati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proprietati_id_seq OWNER TO postgres;

--
-- Name: proprietati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proprietati_id_seq OWNED BY public.proprietati.id;


--
-- Name: scari; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scari (
    id integer NOT NULL,
    bloc_id integer NOT NULL,
    denumire text NOT NULL
);


ALTER TABLE public.scari OWNER TO postgres;

--
-- Name: scari_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scari_id_seq OWNER TO postgres;

--
-- Name: scari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scari_id_seq OWNED BY public.scari.id;


--
-- Name: sesizari; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesizari (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    autor_id integer NOT NULL,
    titlu text NOT NULL,
    descriere text NOT NULL,
    status public."StatusSesizare" DEFAULT 'NOUA'::public."StatusSesizare" NOT NULL,
    raspuns text,
    data_creare timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_rezolvare timestamp(3) without time zone
);


ALTER TABLE public.sesizari OWNER TO postgres;

--
-- Name: sesizari_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sesizari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sesizari_id_seq OWNER TO postgres;

--
-- Name: sesizari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sesizari_id_seq OWNED BY public.sesizari.id;


--
-- Name: tranzactii_tokeni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tranzactii_tokeni (
    id integer NOT NULL,
    portofel_id integer NOT NULL,
    tip public."TipTranzactie" NOT NULL,
    cantitate integer NOT NULL,
    sold_dupa integer NOT NULL,
    actiune_id integer,
    comanda_id integer,
    utilizator_id integer,
    descriere text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tranzactii_tokeni OWNER TO postgres;

--
-- Name: tranzactii_tokeni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tranzactii_tokeni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tranzactii_tokeni_id_seq OWNER TO postgres;

--
-- Name: tranzactii_tokeni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tranzactii_tokeni_id_seq OWNED BY public.tranzactii_tokeni.id;


--
-- Name: utilizatori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilizatori (
    id integer NOT NULL,
    asociatie_id integer,
    email text NOT NULL,
    parola_hash text NOT NULL,
    nume text NOT NULL,
    prenume text NOT NULL,
    telefon text,
    rol public."Rol" DEFAULT 'PROPRIETAR'::public."Rol" NOT NULL,
    activ boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.utilizatori OWNER TO postgres;

--
-- Name: utilizatori_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilizatori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilizatori_id_seq OWNER TO postgres;

--
-- Name: utilizatori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilizatori_id_seq OWNED BY public.utilizatori.id;


--
-- Name: abonamente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abonamente ALTER COLUMN id SET DEFAULT nextval('public.abonamente_id_seq'::regclass);


--
-- Name: actiuni_taxabile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actiuni_taxabile ALTER COLUMN id SET DEFAULT nextval('public.actiuni_taxabile_id_seq'::regclass);


--
-- Name: alocari_plati id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alocari_plati ALTER COLUMN id SET DEFAULT nextval('public.alocari_plati_id_seq'::regclass);


--
-- Name: anunturi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anunturi ALTER COLUMN id SET DEFAULT nextval('public.anunturi_id_seq'::regclass);


--
-- Name: apartamente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apartamente ALTER COLUMN id SET DEFAULT nextval('public.apartamente_id_seq'::regclass);


--
-- Name: asociatii id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asociatii ALTER COLUMN id SET DEFAULT nextval('public.asociatii_id_seq'::regclass);


--
-- Name: blocuri id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocuri ALTER COLUMN id SET DEFAULT nextval('public.blocuri_id_seq'::regclass);


--
-- Name: categorii_cheltuieli id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorii_cheltuieli ALTER COLUMN id SET DEFAULT nextval('public.categorii_cheltuieli_id_seq'::regclass);


--
-- Name: citiri_contoare id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citiri_contoare ALTER COLUMN id SET DEFAULT nextval('public.citiri_contoare_id_seq'::regclass);


--
-- Name: comenzi_simulate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate ALTER COLUMN id SET DEFAULT nextval('public.comenzi_simulate_id_seq'::regclass);


--
-- Name: contoare id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contoare ALTER COLUMN id SET DEFAULT nextval('public.contoare_id_seq'::regclass);


--
-- Name: cupoane_reducere id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupoane_reducere ALTER COLUMN id SET DEFAULT nextval('public.cupoane_reducere_id_seq'::regclass);


--
-- Name: detalii_intretinere id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalii_intretinere ALTER COLUMN id SET DEFAULT nextval('public.detalii_intretinere_id_seq'::regclass);


--
-- Name: facturi_furnizori id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_furnizori ALTER COLUMN id SET DEFAULT nextval('public.facturi_furnizori_id_seq'::regclass);


--
-- Name: facturi_simulate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_simulate ALTER COLUMN id SET DEFAULT nextval('public.facturi_simulate_id_seq'::regclass);


--
-- Name: fise_intretinere id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fise_intretinere ALTER COLUMN id SET DEFAULT nextval('public.fise_intretinere_id_seq'::regclass);


--
-- Name: fonduri id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fonduri ALTER COLUMN id SET DEFAULT nextval('public.fonduri_id_seq'::regclass);


--
-- Name: furnizori id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.furnizori ALTER COLUMN id SET DEFAULT nextval('public.furnizori_id_seq'::regclass);


--
-- Name: luni_intretinere id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.luni_intretinere ALTER COLUMN id SET DEFAULT nextval('public.luni_intretinere_id_seq'::regclass);


--
-- Name: notificari id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificari ALTER COLUMN id SET DEFAULT nextval('public.notificari_id_seq'::regclass);


--
-- Name: pachete_tokeni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pachete_tokeni ALTER COLUMN id SET DEFAULT nextval('public.pachete_tokeni_id_seq'::regclass);


--
-- Name: penalizari id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalizari ALTER COLUMN id SET DEFAULT nextval('public.penalizari_id_seq'::regclass);


--
-- Name: planuri id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planuri ALTER COLUMN id SET DEFAULT nextval('public.planuri_id_seq'::regclass);


--
-- Name: plati id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plati ALTER COLUMN id SET DEFAULT nextval('public.plati_id_seq'::regclass);


--
-- Name: portofele_tokeni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portofele_tokeni ALTER COLUMN id SET DEFAULT nextval('public.portofele_tokeni_id_seq'::regclass);


--
-- Name: proprietati id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proprietati ALTER COLUMN id SET DEFAULT nextval('public.proprietati_id_seq'::regclass);


--
-- Name: scari id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scari ALTER COLUMN id SET DEFAULT nextval('public.scari_id_seq'::regclass);


--
-- Name: sesizari id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesizari ALTER COLUMN id SET DEFAULT nextval('public.sesizari_id_seq'::regclass);


--
-- Name: tranzactii_tokeni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tranzactii_tokeni ALTER COLUMN id SET DEFAULT nextval('public.tranzactii_tokeni_id_seq'::regclass);


--
-- Name: utilizatori id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizatori ALTER COLUMN id SET DEFAULT nextval('public.utilizatori_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ca145d1c-6563-44a9-a2fa-15d327016187	c2b1648481ca0cf29cc6b70a60ce6a9633ca0fed9032bb2fd4f28da05b4f93e5	2026-11-10 18:28:03.182073+00	20261110150000_init	\N	\N	2026-11-10 18:28:02.329297+00	1
2f5565b0-6d54-4474-95bf-05883d19e6dd	7db546e94edbe30a77a613d25f24b40bb064d6b17aa4120495953ad970d263ea	2026-11-10 18:28:03.190166+00	20261110150100_date_test	\N	\N	2026-11-10 18:28:03.183128+00	1
686cff4b-965b-4d2c-b4b7-f8ed88d6a93e	abcafd966830eee4380b513fa4bcec3b24c743adf53119bca802af84f4b2ab9c	2026-11-10 18:28:03.239151+00	20261110160000_modificari_planuri_cupoane_facturi	\N	\N	2026-11-10 18:28:03.191105+00	1
\.


--
-- Data for Name: abonamente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.abonamente (id, asociatie_id, plan_id, plan_urmator_id, inceput_perioada, sfarsit_perioada, status, reinnoire_automata, created_at) FROM stdin;
\.


--
-- Data for Name: actiuni_taxabile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actiuni_taxabile (id, cod, denumire, cost_tokeni) FROM stdin;
\.


--
-- Data for Name: alocari_plati; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alocari_plati (id, plata_id, fisa_id, suma) FROM stdin;
\.


--
-- Data for Name: anunturi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anunturi (id, asociatie_id, autor_id, titlu, continut, important, data_publicare) FROM stdin;
\.


--
-- Data for Name: apartamente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.apartamente (id, scara_id, numar, etaj, suprafata_utila, cota_parte, nr_persoane) FROM stdin;
\.


--
-- Data for Name: asociatii; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asociatii (id, denumire, cui, adresa, iban, banca, zi_limita_citiri, zile_scadenta, procent_penalizare_zi, zile_gratie_penalizare, created_at) FROM stdin;
\.


--
-- Data for Name: blocuri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocuri (id, asociatie_id, denumire, adresa) FROM stdin;
\.


--
-- Data for Name: categorii_cheltuieli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorii_cheltuieli (id, asociatie_id, denumire, mod_repartizare, activa) FROM stdin;
\.


--
-- Data for Name: citiri_contoare; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.citiri_contoare (id, contor_id, luna_id, introdus_de_id, index, consum, data_citire, sursa, validata) FROM stdin;
\.


--
-- Data for Name: comenzi_simulate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comenzi_simulate (id, asociatie_id, utilizator_id, abonament_id, tip, plan_id, pachet_id, suma, status, referinta, achitata_la, created_at) FROM stdin;
\.


--
-- Data for Name: contoare; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contoare (id, apartament_id, serie, data_verificare_metrologica, activ) FROM stdin;
\.


--
-- Data for Name: cupoane_reducere; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cupoane_reducere (id, cod, procent_reducere, plan_id, valabil_pana, utilizari_maxime, utilizari, activ, created_at) FROM stdin;
1	BUNVENIT20	20.00	2	2026-12-31	100	0	t	2026-11-10 18:28:03.187
2	TOAMNA10	10.00	\N	2026-11-30	50	12	t	2026-11-10 18:28:03.187
3	MAX15	15.00	3	2026-11-30	20	3	t	2026-11-10 18:28:12.319
4	VARA5	7.50	\N	2026-08-31	10	10	f	2026-11-10 18:28:12.323
\.


--
-- Data for Name: detalii_intretinere; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalii_intretinere (id, fisa_id, categorie_id, baza_calcul, suma) FROM stdin;
\.


--
-- Data for Name: facturi_furnizori; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facturi_furnizori (id, furnizor_id, luna_id, categorie_id, numar, data_emitere, data_scadenta, suma, cantitate, platita, fisier_url) FROM stdin;
\.


--
-- Data for Name: facturi_simulate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facturi_simulate (id, comanda_id, numar, data_emitere, subtotal, tva, total, created_at) FROM stdin;
\.


--
-- Data for Name: fise_intretinere; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fise_intretinere (id, luna_id, apartament_id, total_luna_curenta, restanta_anterioara, penalizari, total_de_plata, achitat, status, created_at) FROM stdin;
\.


--
-- Data for Name: fonduri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fonduri (id, asociatie_id, tip, sold, contributie_lunara) FROM stdin;
\.


--
-- Data for Name: furnizori; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.furnizori (id, asociatie_id, denumire, cui, iban) FROM stdin;
\.


--
-- Data for Name: luni_intretinere; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.luni_intretinere (id, asociatie_id, an, luna, status, data_limita_citiri, data_publicare, data_scadenta, aprobat_de_id) FROM stdin;
\.


--
-- Data for Name: notificari; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificari (id, utilizator_id, tip, mesaj, citita, data_creare) FROM stdin;
\.


--
-- Data for Name: pachete_tokeni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pachete_tokeni (id, denumire, tokeni, pret, activ) FROM stdin;
\.


--
-- Data for Name: penalizari; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalizari (id, fisa_id, data_calcul, zile_intarziere, suma) FROM stdin;
\.


--
-- Data for Name: planuri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.planuri (id, cod, denumire, pret_lunar, tokeni_lunari, max_apartamente, max_blocuri, raport_anual, activ, descriere, pret_anual, recomandat) FROM stdin;
1	FREE	Free	0.00	50	30	1	f	t	Pentru asociatiile mici: 50 de tokeni pe luna, reinnoiti automat.	\N	f
2	PRO	Pro	49.00	400	300	5	t	t	400 de tokeni pe luna si raport anual; se plateste lunar.	490.00	t
3	MAX	Max	149.00	2000	\N	\N	t	t	2000 de tokeni pe luna, fara limita de blocuri si apartamente.	1490.00	f
\.


--
-- Data for Name: plati; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plati (id, apartament_id, platitor_id, inregistrat_de_id, suma, data_plata, metoda, numar_chitanta, status) FROM stdin;
\.


--
-- Data for Name: portofele_tokeni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.portofele_tokeni (id, asociatie_id, tokeni_plan, tokeni_extra, ultima_resetare, updated_at) FROM stdin;
\.


--
-- Data for Name: proprietati; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proprietati (id, apartament_id, utilizator_id, procent_detinere, data_inceput, data_sfarsit) FROM stdin;
\.


--
-- Data for Name: scari; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scari (id, bloc_id, denumire) FROM stdin;
\.


--
-- Data for Name: sesizari; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sesizari (id, apartament_id, autor_id, titlu, descriere, status, raspuns, data_creare, data_rezolvare) FROM stdin;
\.


--
-- Data for Name: tranzactii_tokeni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tranzactii_tokeni (id, portofel_id, tip, cantitate, sold_dupa, actiune_id, comanda_id, utilizator_id, descriere, created_at) FROM stdin;
\.


--
-- Data for Name: utilizatori; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilizatori (id, asociatie_id, email, parola_hash, nume, prenume, telefon, rol, activ, created_at, updated_at) FROM stdin;
\.


--
-- Name: abonamente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.abonamente_id_seq', 1, false);


--
-- Name: actiuni_taxabile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actiuni_taxabile_id_seq', 1, false);


--
-- Name: alocari_plati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alocari_plati_id_seq', 1, false);


--
-- Name: anunturi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anunturi_id_seq', 1, false);


--
-- Name: apartamente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.apartamente_id_seq', 1, false);


--
-- Name: asociatii_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asociatii_id_seq', 1, false);


--
-- Name: blocuri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blocuri_id_seq', 1, false);


--
-- Name: categorii_cheltuieli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorii_cheltuieli_id_seq', 1, false);


--
-- Name: citiri_contoare_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.citiri_contoare_id_seq', 1, false);


--
-- Name: comenzi_simulate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comenzi_simulate_id_seq', 1, false);


--
-- Name: contoare_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contoare_id_seq', 1, false);


--
-- Name: cupoane_reducere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cupoane_reducere_id_seq', 4, true);


--
-- Name: detalii_intretinere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalii_intretinere_id_seq', 1, false);


--
-- Name: facturi_furnizori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facturi_furnizori_id_seq', 1, false);


--
-- Name: facturi_simulate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facturi_simulate_id_seq', 1, false);


--
-- Name: fise_intretinere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fise_intretinere_id_seq', 1, false);


--
-- Name: fonduri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fonduri_id_seq', 1, false);


--
-- Name: furnizori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.furnizori_id_seq', 1, false);


--
-- Name: luni_intretinere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.luni_intretinere_id_seq', 1, false);


--
-- Name: notificari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificari_id_seq', 1, false);


--
-- Name: pachete_tokeni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pachete_tokeni_id_seq', 1, false);


--
-- Name: penalizari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penalizari_id_seq', 1, false);


--
-- Name: planuri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.planuri_id_seq', 3, true);


--
-- Name: plati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plati_id_seq', 1, false);


--
-- Name: portofele_tokeni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.portofele_tokeni_id_seq', 1, false);


--
-- Name: proprietati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proprietati_id_seq', 1, false);


--
-- Name: scari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scari_id_seq', 1, false);


--
-- Name: sesizari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sesizari_id_seq', 1, false);


--
-- Name: tranzactii_tokeni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tranzactii_tokeni_id_seq', 1, false);


--
-- Name: utilizatori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilizatori_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: abonamente abonamente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_pkey PRIMARY KEY (id);


--
-- Name: actiuni_taxabile actiuni_taxabile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actiuni_taxabile
    ADD CONSTRAINT actiuni_taxabile_pkey PRIMARY KEY (id);


--
-- Name: alocari_plati alocari_plati_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alocari_plati
    ADD CONSTRAINT alocari_plati_pkey PRIMARY KEY (id);


--
-- Name: anunturi anunturi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anunturi
    ADD CONSTRAINT anunturi_pkey PRIMARY KEY (id);


--
-- Name: apartamente apartamente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apartamente
    ADD CONSTRAINT apartamente_pkey PRIMARY KEY (id);


--
-- Name: asociatii asociatii_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asociatii
    ADD CONSTRAINT asociatii_pkey PRIMARY KEY (id);


--
-- Name: blocuri blocuri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocuri
    ADD CONSTRAINT blocuri_pkey PRIMARY KEY (id);


--
-- Name: categorii_cheltuieli categorii_cheltuieli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorii_cheltuieli
    ADD CONSTRAINT categorii_cheltuieli_pkey PRIMARY KEY (id);


--
-- Name: citiri_contoare citiri_contoare_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_pkey PRIMARY KEY (id);


--
-- Name: comenzi_simulate comenzi_simulate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_pkey PRIMARY KEY (id);


--
-- Name: contoare contoare_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contoare
    ADD CONSTRAINT contoare_pkey PRIMARY KEY (id);


--
-- Name: cupoane_reducere cupoane_reducere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupoane_reducere
    ADD CONSTRAINT cupoane_reducere_pkey PRIMARY KEY (id);


--
-- Name: detalii_intretinere detalii_intretinere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalii_intretinere
    ADD CONSTRAINT detalii_intretinere_pkey PRIMARY KEY (id);


--
-- Name: facturi_furnizori facturi_furnizori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_pkey PRIMARY KEY (id);


--
-- Name: facturi_simulate facturi_simulate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_simulate
    ADD CONSTRAINT facturi_simulate_pkey PRIMARY KEY (id);


--
-- Name: fise_intretinere fise_intretinere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fise_intretinere
    ADD CONSTRAINT fise_intretinere_pkey PRIMARY KEY (id);


--
-- Name: fonduri fonduri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fonduri
    ADD CONSTRAINT fonduri_pkey PRIMARY KEY (id);


--
-- Name: furnizori furnizori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.furnizori
    ADD CONSTRAINT furnizori_pkey PRIMARY KEY (id);


--
-- Name: luni_intretinere luni_intretinere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.luni_intretinere
    ADD CONSTRAINT luni_intretinere_pkey PRIMARY KEY (id);


--
-- Name: notificari notificari_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificari
    ADD CONSTRAINT notificari_pkey PRIMARY KEY (id);


--
-- Name: pachete_tokeni pachete_tokeni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pachete_tokeni
    ADD CONSTRAINT pachete_tokeni_pkey PRIMARY KEY (id);


--
-- Name: penalizari penalizari_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalizari
    ADD CONSTRAINT penalizari_pkey PRIMARY KEY (id);


--
-- Name: planuri planuri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planuri
    ADD CONSTRAINT planuri_pkey PRIMARY KEY (id);


--
-- Name: plati plati_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_pkey PRIMARY KEY (id);


--
-- Name: portofele_tokeni portofele_tokeni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portofele_tokeni
    ADD CONSTRAINT portofele_tokeni_pkey PRIMARY KEY (id);


--
-- Name: proprietati proprietati_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proprietati
    ADD CONSTRAINT proprietati_pkey PRIMARY KEY (id);


--
-- Name: scari scari_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scari
    ADD CONSTRAINT scari_pkey PRIMARY KEY (id);


--
-- Name: sesizari sesizari_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesizari
    ADD CONSTRAINT sesizari_pkey PRIMARY KEY (id);


--
-- Name: tranzactii_tokeni tranzactii_tokeni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_pkey PRIMARY KEY (id);


--
-- Name: utilizatori utilizatori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizatori
    ADD CONSTRAINT utilizatori_pkey PRIMARY KEY (id);


--
-- Name: abonamente_asociatie_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX abonamente_asociatie_id_status_idx ON public.abonamente USING btree (asociatie_id, status);


--
-- Name: abonamente_status_sfarsit_perioada_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX abonamente_status_sfarsit_perioada_idx ON public.abonamente USING btree (status, sfarsit_perioada);


--
-- Name: actiuni_taxabile_cod_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX actiuni_taxabile_cod_key ON public.actiuni_taxabile USING btree (cod);


--
-- Name: alocari_plati_plata_id_fisa_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX alocari_plati_plata_id_fisa_id_key ON public.alocari_plati USING btree (plata_id, fisa_id);


--
-- Name: apartamente_scara_id_numar_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX apartamente_scara_id_numar_key ON public.apartamente USING btree (scara_id, numar);


--
-- Name: asociatii_cui_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX asociatii_cui_key ON public.asociatii USING btree (cui);


--
-- Name: blocuri_asociatie_id_denumire_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX blocuri_asociatie_id_denumire_key ON public.blocuri USING btree (asociatie_id, denumire);


--
-- Name: categorii_cheltuieli_asociatie_id_denumire_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categorii_cheltuieli_asociatie_id_denumire_key ON public.categorii_cheltuieli USING btree (asociatie_id, denumire);


--
-- Name: citiri_contoare_contor_id_luna_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX citiri_contoare_contor_id_luna_id_key ON public.citiri_contoare USING btree (contor_id, luna_id);


--
-- Name: comenzi_simulate_asociatie_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comenzi_simulate_asociatie_id_created_at_idx ON public.comenzi_simulate USING btree (asociatie_id, created_at);


--
-- Name: comenzi_simulate_referinta_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX comenzi_simulate_referinta_key ON public.comenzi_simulate USING btree (referinta);


--
-- Name: comenzi_simulate_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comenzi_simulate_status_idx ON public.comenzi_simulate USING btree (status);


--
-- Name: contoare_apartament_id_serie_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX contoare_apartament_id_serie_key ON public.contoare USING btree (apartament_id, serie);


--
-- Name: cupoane_reducere_cod_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cupoane_reducere_cod_key ON public.cupoane_reducere USING btree (cod);


--
-- Name: detalii_intretinere_fisa_id_categorie_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX detalii_intretinere_fisa_id_categorie_id_key ON public.detalii_intretinere USING btree (fisa_id, categorie_id);


--
-- Name: facturi_furnizori_furnizor_id_numar_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX facturi_furnizori_furnizor_id_numar_key ON public.facturi_furnizori USING btree (furnizor_id, numar);


--
-- Name: facturi_furnizori_luna_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facturi_furnizori_luna_id_idx ON public.facturi_furnizori USING btree (luna_id);


--
-- Name: facturi_simulate_comanda_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX facturi_simulate_comanda_id_key ON public.facturi_simulate USING btree (comanda_id);


--
-- Name: facturi_simulate_numar_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX facturi_simulate_numar_key ON public.facturi_simulate USING btree (numar);


--
-- Name: fise_intretinere_apartament_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fise_intretinere_apartament_id_status_idx ON public.fise_intretinere USING btree (apartament_id, status);


--
-- Name: fise_intretinere_luna_id_apartament_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX fise_intretinere_luna_id_apartament_id_key ON public.fise_intretinere USING btree (luna_id, apartament_id);


--
-- Name: fonduri_asociatie_id_tip_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX fonduri_asociatie_id_tip_key ON public.fonduri USING btree (asociatie_id, tip);


--
-- Name: furnizori_asociatie_id_cui_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX furnizori_asociatie_id_cui_key ON public.furnizori USING btree (asociatie_id, cui);


--
-- Name: luni_intretinere_asociatie_id_an_luna_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX luni_intretinere_asociatie_id_an_luna_key ON public.luni_intretinere USING btree (asociatie_id, an, luna);


--
-- Name: notificari_utilizator_id_citita_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notificari_utilizator_id_citita_idx ON public.notificari USING btree (utilizator_id, citita);


--
-- Name: penalizari_fisa_id_data_calcul_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX penalizari_fisa_id_data_calcul_key ON public.penalizari USING btree (fisa_id, data_calcul);


--
-- Name: planuri_cod_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX planuri_cod_key ON public.planuri USING btree (cod);


--
-- Name: plati_apartament_id_data_plata_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plati_apartament_id_data_plata_idx ON public.plati USING btree (apartament_id, data_plata);


--
-- Name: plati_numar_chitanta_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plati_numar_chitanta_key ON public.plati USING btree (numar_chitanta);


--
-- Name: portofele_tokeni_asociatie_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX portofele_tokeni_asociatie_id_key ON public.portofele_tokeni USING btree (asociatie_id);


--
-- Name: proprietati_utilizator_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proprietati_utilizator_id_idx ON public.proprietati USING btree (utilizator_id);


--
-- Name: scari_bloc_id_denumire_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX scari_bloc_id_denumire_key ON public.scari USING btree (bloc_id, denumire);


--
-- Name: sesizari_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sesizari_status_idx ON public.sesizari USING btree (status);


--
-- Name: tranzactii_tokeni_portofel_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tranzactii_tokeni_portofel_id_created_at_idx ON public.tranzactii_tokeni USING btree (portofel_id, created_at);


--
-- Name: utilizatori_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX utilizatori_email_key ON public.utilizatori USING btree (email);


--
-- Name: abonamente abonamente_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: abonamente abonamente_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: abonamente abonamente_plan_urmator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_plan_urmator_id_fkey FOREIGN KEY (plan_urmator_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: alocari_plati alocari_plati_fisa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alocari_plati
    ADD CONSTRAINT alocari_plati_fisa_id_fkey FOREIGN KEY (fisa_id) REFERENCES public.fise_intretinere(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: alocari_plati alocari_plati_plata_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alocari_plati
    ADD CONSTRAINT alocari_plati_plata_id_fkey FOREIGN KEY (plata_id) REFERENCES public.plati(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: anunturi anunturi_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anunturi
    ADD CONSTRAINT anunturi_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: anunturi anunturi_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anunturi
    ADD CONSTRAINT anunturi_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: apartamente apartamente_scara_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apartamente
    ADD CONSTRAINT apartamente_scara_id_fkey FOREIGN KEY (scara_id) REFERENCES public.scari(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blocuri blocuri_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocuri
    ADD CONSTRAINT blocuri_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categorii_cheltuieli categorii_cheltuieli_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorii_cheltuieli
    ADD CONSTRAINT categorii_cheltuieli_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: citiri_contoare citiri_contoare_contor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_contor_id_fkey FOREIGN KEY (contor_id) REFERENCES public.contoare(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: citiri_contoare citiri_contoare_introdus_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_introdus_de_id_fkey FOREIGN KEY (introdus_de_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: citiri_contoare citiri_contoare_luna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_luna_id_fkey FOREIGN KEY (luna_id) REFERENCES public.luni_intretinere(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comenzi_simulate comenzi_simulate_abonament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_abonament_id_fkey FOREIGN KEY (abonament_id) REFERENCES public.abonamente(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comenzi_simulate comenzi_simulate_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comenzi_simulate comenzi_simulate_pachet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_pachet_id_fkey FOREIGN KEY (pachet_id) REFERENCES public.pachete_tokeni(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comenzi_simulate comenzi_simulate_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comenzi_simulate comenzi_simulate_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contoare contoare_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contoare
    ADD CONSTRAINT contoare_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cupoane_reducere cupoane_reducere_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupoane_reducere
    ADD CONSTRAINT cupoane_reducere_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: detalii_intretinere detalii_intretinere_categorie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalii_intretinere
    ADD CONSTRAINT detalii_intretinere_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.categorii_cheltuieli(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalii_intretinere detalii_intretinere_fisa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalii_intretinere
    ADD CONSTRAINT detalii_intretinere_fisa_id_fkey FOREIGN KEY (fisa_id) REFERENCES public.fise_intretinere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: facturi_furnizori facturi_furnizori_categorie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.categorii_cheltuieli(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: facturi_furnizori facturi_furnizori_furnizor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_furnizor_id_fkey FOREIGN KEY (furnizor_id) REFERENCES public.furnizori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: facturi_furnizori facturi_furnizori_luna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_luna_id_fkey FOREIGN KEY (luna_id) REFERENCES public.luni_intretinere(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: facturi_simulate facturi_simulate_comanda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturi_simulate
    ADD CONSTRAINT facturi_simulate_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comenzi_simulate(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fise_intretinere fise_intretinere_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fise_intretinere
    ADD CONSTRAINT fise_intretinere_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fise_intretinere fise_intretinere_luna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fise_intretinere
    ADD CONSTRAINT fise_intretinere_luna_id_fkey FOREIGN KEY (luna_id) REFERENCES public.luni_intretinere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fonduri fonduri_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fonduri
    ADD CONSTRAINT fonduri_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: furnizori furnizori_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.furnizori
    ADD CONSTRAINT furnizori_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: luni_intretinere luni_intretinere_aprobat_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.luni_intretinere
    ADD CONSTRAINT luni_intretinere_aprobat_de_id_fkey FOREIGN KEY (aprobat_de_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: luni_intretinere luni_intretinere_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.luni_intretinere
    ADD CONSTRAINT luni_intretinere_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notificari notificari_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificari
    ADD CONSTRAINT notificari_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penalizari penalizari_fisa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalizari
    ADD CONSTRAINT penalizari_fisa_id_fkey FOREIGN KEY (fisa_id) REFERENCES public.fise_intretinere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plati plati_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: plati plati_inregistrat_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_inregistrat_de_id_fkey FOREIGN KEY (inregistrat_de_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plati plati_platitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_platitor_id_fkey FOREIGN KEY (platitor_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: portofele_tokeni portofele_tokeni_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portofele_tokeni
    ADD CONSTRAINT portofele_tokeni_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proprietati proprietati_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proprietati
    ADD CONSTRAINT proprietati_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proprietati proprietati_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proprietati
    ADD CONSTRAINT proprietati_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: scari scari_bloc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scari
    ADD CONSTRAINT scari_bloc_id_fkey FOREIGN KEY (bloc_id) REFERENCES public.blocuri(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sesizari sesizari_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesizari
    ADD CONSTRAINT sesizari_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sesizari sesizari_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesizari
    ADD CONSTRAINT sesizari_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_actiune_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_actiune_id_fkey FOREIGN KEY (actiune_id) REFERENCES public.actiuni_taxabile(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_comanda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comenzi_simulate(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_portofel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_portofel_id_fkey FOREIGN KEY (portofel_id) REFERENCES public.portofele_tokeni(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: utilizatori utilizatori_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizatori
    ADD CONSTRAINT utilizatori_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict qaK7QuA2kHPFRIopZVrWvllkuky9DZT0yucIPwLiWqCOvsMHyrhVmoqhI9ZwkNA

