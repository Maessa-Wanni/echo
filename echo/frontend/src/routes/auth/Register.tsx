import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { I18nLink } from "@/components/common/i18nLink";
import { ADMIN_BASE_URL } from "@/config";
import { useRegisterMutation } from "@/lib/query";
import {
  Alert,
  Button,
  Container,
  Divider,
  PasswordInput,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const RegisterRoute = () => {
  useDocumentTitle(t`Register | Dembrane`);
  const { register, handleSubmit } = useForm<{
    email: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
  }>();

  const [error, setError] = useState("");

  const registerMutation = useRegisterMutation();

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      setError(t`Passwords do not match`);
      return;
    }

    registerMutation.mutate([
      data.email,
      data.password,
      {
        first_name: data.first_name,
        last_name: data.last_name,
        verification_url: `${ADMIN_BASE_URL}/verify-email`,
      },
    ]);
  });

  return (
    <Container size="sm" className="!h-full">
      <Stack className="h-full">
        <Stack className="flex-grow">
          <Title order={1}>
            <Trans>Create an Account</Trans>
          </Title>

          <form onSubmit={onSubmit}>
            <Stack>
              {error && <Alert color="red">{error}</Alert>}
              {registerMutation.error && (
                <Alert color="red">{registerMutation.error.message}</Alert>
              )}
              <SimpleGrid
                cols={{
                  xs: 1,
                  sm: 2,
                }}
                spacing="md"
              >
                <TextInput
                  size="lg"
                  label={<Trans>First Name</Trans>}
                  {...register("first_name")}
                  placeholder={t`First Name`}
                  required
                />
                <TextInput
                  size="lg"
                  label={<Trans>Last Name</Trans>}
                  {...register("last_name")}
                  placeholder={t`Last Name`}
                  required
                />
              </SimpleGrid>
              <TextInput
                size="lg"
                label="Email"
                {...register("email")}
                placeholder="Email"
                required
                type="email"
              />
              <PasswordInput
                label={<Trans>Password</Trans>}
                size="lg"
                {...register("password")}
                placeholder={t`Password`}
                required
              />
              <PasswordInput
                label={<Trans>Confirm Password</Trans>}
                size="lg"
                {...register("confirmPassword")}
                placeholder={t`Confirm Password`}
                required
              />
              <Button
                size="lg"
                type="submit"
                loading={registerMutation.isPending}
              >
                Register
              </Button>
            </Stack>
          </form>

          <Divider variant="dashed" label="or" labelPosition="center" />

          <I18nLink to="/login">
            <Button size="lg" variant="outline" fullWidth>
              <Trans>Login as an existing user</Trans>
            </Button>
          </I18nLink>
        </Stack>
      </Stack>
    </Container>
  );
};
